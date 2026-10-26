import { OWNED_TABS_STORAGE_KEY } from "../shared/constants";
import { logger } from "../shared/logger";
import { t } from "../shared/i18n";

const CDP_VERSION = "1.3";
const TIMEZONE_COMMAND = "Emulation.setTimezoneOverride";

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function userFacingError(error: unknown): string {
  const message = errorText(error).toLowerCase();
  if (message.includes("another debugger") || message.includes("already attached")) {
    return t("anotherDebuggerAttached");
  }
  return t("unableToApplyTimezone");
}

export interface DebuggerReconcileResult {
  active: boolean;
  error?: string;
}

export class DebuggerManager {
  private readonly ownedTabs = new Set<number>();
  private readonly recoveryCandidates = new Set<number>();
  private readonly failures = new Map<number, string>();
  private persistence: Promise<void> = Promise.resolve();

  constructor() {
    chrome.debugger.onDetach.addListener((source, reason) => {
      const tabId = source.tabId;
      if (tabId === undefined) return;
      if (!this.ownedTabs.has(tabId) && !this.recoveryCandidates.has(tabId)) return;
      this.ownedTabs.delete(tabId);
      this.recoveryCandidates.delete(tabId);
      this.failures.set(
        tabId,
        reason === "canceled_by_user" ? t("debuggerDisconnected") : t("debuggerSessionUnavailable"),
      );
      void this.persistOwnership();
      logger.warn("Debugger detached", tabId, reason);
    });
  }

  async initialize(): Promise<void> {
    try {
      const stored = await chrome.storage.local.get(OWNED_TABS_STORAGE_KEY);
      const ids: unknown = stored[OWNED_TABS_STORAGE_KEY];
      if (Array.isArray(ids)) {
        for (const id of ids) {
          if (typeof id === "number" && Number.isInteger(id) && id >= 0) {
            this.recoveryCandidates.add(id);
          }
        }
      }
    } catch (error) {
      logger.error("Could not read debugger ownership journal", error);
    }
  }

  isAttached(tabId: number): boolean {
    return this.ownedTabs.has(tabId);
  }

  getFailure(tabId: number): string | undefined {
    return this.failures.get(tabId);
  }

  getJournalTabIds(): number[] {
    return [...new Set([...this.ownedTabs, ...this.recoveryCandidates])];
  }

  async reconcileTab(tabId: number, timezone: string | null): Promise<DebuggerReconcileResult> {
    if (this.recoveryCandidates.has(tabId)) {
      const recovered = await this.recover(tabId, timezone);
      if (recovered) {
        if (!timezone) {
          await this.detach(tabId);
          return { active: false };
        }
        return { active: true };
      }
    }

    if (!timezone) {
      await this.detach(tabId);
      this.failures.delete(tabId);
      return { active: false };
    }

    if (!this.ownedTabs.has(tabId)) {
      try {
        await chrome.debugger.attach({ tabId }, CDP_VERSION);
        this.ownedTabs.add(tabId);
        this.failures.delete(tabId);
        await this.persistOwnership();
        logger.info("Debugger attached", tabId);
      } catch (error) {
        const message = userFacingError(error);
        this.failures.set(tabId, message);
        logger.warn("Debugger attach failed", tabId, error);
        return { active: false, error: message };
      }
    }

    try {
      await chrome.debugger.sendCommand({ tabId }, TIMEZONE_COMMAND, { timezoneId: timezone });
      this.failures.delete(tabId);
      logger.info("Timezone applied", tabId, timezone);
      return { active: true };
    } catch (error) {
      const message = userFacingError(error);
      this.failures.set(tabId, message);
      logger.warn("Timezone command failed", tabId, error);
      await this.detach(tabId);
      this.failures.set(tabId, message);
      return { active: false, error: message };
    }
  }

  async detach(tabId: number): Promise<void> {
    if (!this.ownedTabs.has(tabId)) return;

    try {
      await chrome.debugger.sendCommand({ tabId }, TIMEZONE_COMMAND, { timezoneId: "" });
    } catch (error) {
      logger.warn("Could not clear timezone override before detach", tabId, error);
    }

    try {
      await chrome.debugger.detach({ tabId });
      logger.info("Debugger detached", tabId);
    } catch (error) {
      logger.warn("Debugger detach failed", tabId, error);
    } finally {
      this.ownedTabs.delete(tabId);
      await this.persistOwnership();
    }
  }

  async forgetTab(tabId: number): Promise<void> {
    this.ownedTabs.delete(tabId);
    this.recoveryCandidates.delete(tabId);
    this.failures.delete(tabId);
    await this.persistOwnership();
  }

  async cleanupClosedTabs(openTabIds: ReadonlySet<number>): Promise<void> {
    let changed = false;
    for (const tabId of this.recoveryCandidates) {
      if (!openTabIds.has(tabId)) {
        this.recoveryCandidates.delete(tabId);
        changed = true;
      }
    }
    if (changed) await this.persistOwnership();
  }

  private async recover(tabId: number, timezone: string | null): Promise<boolean> {
    try {
      await chrome.debugger.sendCommand({ tabId }, TIMEZONE_COMMAND, {
        timezoneId: timezone ?? "",
      });
      this.recoveryCandidates.delete(tabId);
      this.ownedTabs.add(tabId);
      this.failures.delete(tabId);
      await this.persistOwnership();
      logger.info("Recovered owned debugger session", tabId);
      return true;
    } catch (error) {
      this.recoveryCandidates.delete(tabId);
      await this.persistOwnership();
      logger.info("Could not confirm debugger ownership; leaving session untouched", tabId, error);
      return false;
    }
  }

  private persistOwnership(): Promise<void> {
    this.persistence = this.persistence
      .catch((error: unknown) => logger.error("Ownership journal write failed", error))
      .then(async () => {
        const ids = [...new Set([...this.ownedTabs, ...this.recoveryCandidates])].sort(
          (a, b) => a - b,
        );
        await chrome.storage.local.set({ [OWNED_TABS_STORAGE_KEY]: ids });
      })
      .catch((error: unknown) => logger.error("Ownership journal write failed", error));
    return this.persistence;
  }
}
