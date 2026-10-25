import type { ZoneGuardSettings } from "./types";

export const EXTENSION_NAME = "ZoneGuard";
export const EXTENSION_VERSION = "0.1.0";
export const SETTINGS_STORAGE_KEY = "zoneguard.settings";
export const OWNED_TABS_STORAGE_KEY = "zoneguard.ownedTabs";

export const DEFAULT_SETTINGS: ZoneGuardSettings = {
  enabled: true,
  timezone: "America/New_York",
  whitelist: [],
};
