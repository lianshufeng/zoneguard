import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./constants";
import { normalizePattern, validatePattern } from "./patternMatcher";
import { isValidTimezone } from "./timezoneUtils";
import type { WhitelistRule, ZoneGuardSettings } from "./types";

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function copyDefaults(): ZoneGuardSettings {
  return { ...DEFAULT_SETTINGS, whitelist: [] };
}

function sanitizeWhitelist(value: unknown): WhitelistRule[] {
  if (!Array.isArray(value)) return [];

  const rules: WhitelistRule[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.pattern !== "string") continue;
    const result = validatePattern(item.pattern);
    if (!result.valid || typeof item.enabled !== "boolean") continue;

    const pattern = result.pattern;
    const key = normalizePattern(pattern).toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rules.push({
      id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
      pattern,
      enabled: item.enabled,
      createdAt:
        typeof item.createdAt === "number" && Number.isFinite(item.createdAt)
          ? item.createdAt
          : Date.now(),
    });
  }
  return rules;
}

function sanitizeSettings(value: unknown): ZoneGuardSettings {
  if (!isRecord(value)) return copyDefaults();

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULT_SETTINGS.enabled,
    timezone:
      typeof value.timezone === "string" && isValidTimezone(value.timezone)
        ? value.timezone
        : DEFAULT_SETTINGS.timezone,
    whitelist: sanitizeWhitelist(value.whitelist),
  };
}

function assertUniquePattern(
  pattern: string,
  rules: readonly WhitelistRule[],
  exceptId?: string,
): void {
  const key = normalizePattern(pattern).toLocaleLowerCase();
  if (
    rules.some(
      (rule) => rule.id !== exceptId && normalizePattern(rule.pattern).toLocaleLowerCase() === key,
    )
  ) {
    throw new SettingsValidationError("This rule already exists.");
  }
}

export class SettingsService {
  async initialize(): Promise<ZoneGuardSettings> {
    const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    if (!Object.hasOwn(stored, SETTINGS_STORAGE_KEY)) {
      const defaults = copyDefaults();
      await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: defaults });
      return defaults;
    }

    const raw = stored[SETTINGS_STORAGE_KEY];
    const settings = sanitizeSettings(raw);
    if (JSON.stringify(raw) !== JSON.stringify(settings)) {
      await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
    }
    return settings;
  }

  async getSettings(): Promise<ZoneGuardSettings> {
    return this.initialize();
  }

  async updateSettings(
    patch: Partial<Pick<ZoneGuardSettings, "enabled" | "timezone">>,
  ): Promise<ZoneGuardSettings> {
    const settings = await this.getSettings();
    const next = { ...settings, ...patch };
    if (typeof next.enabled !== "boolean") {
      throw new SettingsValidationError("Invalid enabled setting.");
    }
    if (!isValidTimezone(next.timezone)) {
      throw new SettingsValidationError("Select a valid IANA timezone.");
    }
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: next });
    return next;
  }

  async setEnabled(enabled: boolean): Promise<ZoneGuardSettings> {
    return this.updateSettings({ enabled });
  }

  async setTimezone(timezone: string): Promise<ZoneGuardSettings> {
    if (!isValidTimezone(timezone)) {
      throw new SettingsValidationError("Select a valid IANA timezone.");
    }
    return this.updateSettings({ timezone });
  }

  async addWhitelistRule(patternInput: string, enabled = true): Promise<WhitelistRule> {
    const validation = validatePattern(patternInput);
    if (!validation.valid) throw new SettingsValidationError(validation.error);
    if (typeof enabled !== "boolean") throw new SettingsValidationError("Invalid rule state.");

    const settings = await this.getSettings();
    assertUniquePattern(validation.pattern, settings.whitelist);
    const rule: WhitelistRule = {
      id: crypto.randomUUID(),
      pattern: validation.pattern,
      enabled,
      createdAt: Date.now(),
    };
    await chrome.storage.local.set({
      [SETTINGS_STORAGE_KEY]: { ...settings, whitelist: [...settings.whitelist, rule] },
    });
    return rule;
  }

  async updateWhitelistRule(
    id: string,
    patch: Partial<Pick<WhitelistRule, "pattern" | "enabled">>,
  ): Promise<void> {
    const settings = await this.getSettings();
    const existing = settings.whitelist.find((rule) => rule.id === id);
    if (!existing) throw new SettingsValidationError("This rule no longer exists.");

    let pattern = existing.pattern;
    if (patch.pattern !== undefined) {
      const validation = validatePattern(patch.pattern);
      if (!validation.valid) throw new SettingsValidationError(validation.error);
      assertUniquePattern(validation.pattern, settings.whitelist, id);
      pattern = validation.pattern;
    }
    const enabled = patch.enabled ?? existing.enabled;
    if (typeof enabled !== "boolean") throw new SettingsValidationError("Invalid rule state.");

    const whitelist = settings.whitelist.map((rule) =>
      rule.id === id ? { ...rule, pattern, enabled } : rule,
    );
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: { ...settings, whitelist } });
  }

  async removeWhitelistRule(id: string): Promise<void> {
    const settings = await this.getSettings();
    const whitelist = settings.whitelist.filter((rule) => rule.id !== id);
    if (whitelist.length === settings.whitelist.length) return;
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: { ...settings, whitelist } });
  }

  async exportSettings(): Promise<string> {
    const settings = await this.getSettings();
    return JSON.stringify(
      {
        version: 1,
        enabled: settings.enabled,
        timezone: settings.timezone,
        whitelist: settings.whitelist.map(({ pattern, enabled }) => ({ pattern, enabled })),
      },
      null,
      2,
    );
  }

  async importSettings(input: string): Promise<ZoneGuardSettings> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input) as unknown;
    } catch {
      throw new SettingsValidationError("The settings file is not valid JSON.");
    }

    if (!isRecord(parsed) || parsed.version !== 1) {
      throw new SettingsValidationError("Unsupported settings file format.");
    }
    if (typeof parsed.enabled !== "boolean") {
      throw new SettingsValidationError("Invalid enabled setting in import file.");
    }
    if (typeof parsed.timezone !== "string" || !isValidTimezone(parsed.timezone)) {
      throw new SettingsValidationError("Select a valid IANA timezone.");
    }
    if (!Array.isArray(parsed.whitelist)) {
      throw new SettingsValidationError("Invalid whitelist in import file.");
    }

    const whitelist: WhitelistRule[] = [];
    const seen = new Set<string>();
    for (const item of parsed.whitelist) {
      if (
        !isRecord(item) ||
        typeof item.pattern !== "string" ||
        typeof item.enabled !== "boolean"
      ) {
        throw new SettingsValidationError("Invalid whitelist rule in import file.");
      }
      const validation = validatePattern(item.pattern);
      if (!validation.valid) throw new SettingsValidationError(validation.error);
      const key = normalizePattern(validation.pattern).toLocaleLowerCase();
      if (seen.has(key)) throw new SettingsValidationError("This rule already exists.");
      seen.add(key);
      whitelist.push({
        id: crypto.randomUUID(),
        pattern: validation.pattern,
        enabled: item.enabled,
        createdAt: Date.now(),
      });
    }

    const settings = { enabled: parsed.enabled, timezone: parsed.timezone, whitelist };
    await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
    return settings;
  }
}
