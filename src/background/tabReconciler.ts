import { DebuggerManager } from "./debuggerManager";
import { logger } from "../shared/logger";
import { matchesAnyWhitelistRule } from "../shared/patternMatcher";
import { SettingsService } from "../shared/settings";
import { hostnameFromUrl, isSupportedUrl } from "../shared/urlUtils";
import { t } from "../shared/i18n";

export interface TabReconcileResult {
  supported: boolean;
  hostname: string;
  enabled: boolean;
  matched: boolean;
  protected: boolean;
  debuggerError: string;
}

const emptyResult = (): TabReconcileResult => ({
  supported: false,
  hostname: "",
  enabled: false,
  matched: false,
  protected: false,
  debuggerError: "",
});

export class TabReconciler {
  private readonly queues = new Map<number, Promise<TabReconcileResult>>();
  private readonly suppressedFailures = new Map<number, { fingerprint: string; message: string }>();

  constructor(
    private readonly debuggerManager: DebuggerManager,
    private readonly settingsService: SettingsService,
    private readonly ready: Promise<void>,
  ) {}

  reconcileTab(tabId: number, forceRetry = false): Promise<TabReconcileResult> {
    const previous = this.queues.get(tabId) ?? Promise.resolve(emptyResult());
    const task = previous
      .catch((error: unknown) => {
        logger.error("Previous tab reconciliation failed", tabId, error);
        return emptyResult();
      })
      .then(() => this.reconcileNow(tabId, forceRetry))
      .catch((error: unknown) => {
        logger.error("Tab reconciliation failed", tabId, error);
        return emptyResult();
      });

    this.queues.set(tabId, task);
    void task.then(() => {
      if (this.queues.get(tabId) === task) this.queues.delete(tabId);
    });
    return task;
  }

  async reconcileAllTabs(): Promise<void> {
    await this.ready;
    const tabs = await chrome.tabs.query({});
    const openTabIds = new Set(tabs.flatMap((tab) => (tab.id === undefined ? [] : [tab.id])));
    await this.debuggerManager.cleanupClosedTabs(openTabIds);
    await Promise.all([...openTabIds].map((tabId) => this.reconcileTab(tabId)));

    for (const tabId of this.debuggerManager.getJournalTabIds()) {
      if (!openTabIds.has(tabId)) await this.debuggerManager.forgetTab(tabId);
    }
  }

  async forgetTab(tabId: number): Promise<void> {
    this.suppressedFailures.delete(tabId);
    await this.debuggerManager.forgetTab(tabId);
  }

  private async reconcileNow(tabId: number, forceRetry: boolean): Promise<TabReconcileResult> {
    await this.ready;

    let tab: chrome.tabs.Tab;
    try {
      tab = await chrome.tabs.get(tabId);
    } catch {
      await this.debuggerManager.forgetTab(tabId);
      return emptyResult();
    }

    const url = tab.url ?? "";
    const supported = isSupportedUrl(url);
    const hostname = hostnameFromUrl(url);
    const settings = await this.settingsService.getSettings();
    const matched = supported && matchesAnyWhitelistRule(url, settings.whitelist);
    const shouldProtect = settings.enabled && matched;

    if (!shouldProtect) {
      this.suppressedFailures.delete(tabId);
      await this.debuggerManager.reconcileTab(tabId, null);
      await this.updateBadge(tabId, false, false);
      return {
        supported,
        hostname,
        enabled: settings.enabled,
        matched,
        protected: false,
        debuggerError: "",
      };
    }

    const fingerprint = `${url}\u0000${JSON.stringify(settings)}`;
    const suppressed = this.suppressedFailures.get(tabId);
    if (!forceRetry && suppressed?.fingerprint === fingerprint) {
      await this.updateBadge(tabId, false, true);
      return {
        supported,
        hostname,
        enabled: settings.enabled,
        matched,
        protected: false,
        debuggerError: suppressed.message,
      };
    }
    if (forceRetry) this.suppressedFailures.delete(tabId);

    const result = await this.debuggerManager.reconcileTab(tabId, settings.timezone);
    if (!result.active && result.error) {
      this.suppressedFailures.set(tabId, { fingerprint, message: result.error });
    } else {
      this.suppressedFailures.delete(tabId);
    }
    await this.updateBadge(tabId, result.active, Boolean(result.error));

    return {
      supported,
      hostname,
      enabled: settings.enabled,
      matched,
      protected: result.active,
      debuggerError: result.error ?? "",
    };
  }

  private async updateBadge(tabId: number, active: boolean, failed: boolean): Promise<void> {
    try {
      await chrome.action.setBadgeText({ tabId, text: active ? "ON" : failed ? "!" : "" });
      await chrome.action.setBadgeBackgroundColor({
        tabId,
        color: active ? "#17834b" : "#b54708",
      });
    } catch (error) {
      logger.warn("Could not update extension badge", tabId, error);
    }
  }
}

export function statusFromResult(result: TabReconcileResult): {
  status: "protected" | "not-whitelisted" | "disabled" | "unsupported" | "debugger-unavailable";
  hostname: string;
  message: string;
} {
  if (!result.supported) {
    return {
      status: "unsupported",
      hostname: result.hostname,
      message: t("pageCannotBeControlled"),
    };
  }
  if (!result.enabled) {
    return { status: "disabled", hostname: result.hostname, message: t("zoneGuardOff") };
  }
  if (!result.matched) {
    return {
      status: "not-whitelisted",
      hostname: result.hostname,
      message: t("siteNotInWhitelist"),
    };
  }
  if (result.debuggerError) {
    return {
      status: "debugger-unavailable",
      hostname: result.hostname,
      message: result.debuggerError,
    };
  }
  if (result.protected) {
    return {
      status: "protected",
      hostname: result.hostname,
      message: t("timezoneOverrideActive"),
    };
  }
  return {
    status: "debugger-unavailable",
    hostname: result.hostname,
    message: t("unableToApplyTimezone"),
  };
}
