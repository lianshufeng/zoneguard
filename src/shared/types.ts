export interface WhitelistRule {
  id: string;
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

export interface ZoneGuardSettings {
  enabled: boolean;
  timezone: string;
  whitelist: WhitelistRule[];
}

export interface TimezoneOption {
  id: string;
  label: string;
  city: string;
  country: string;
  keywords: string[];
}

export type TabProtectionStatus =
  "protected" | "not-whitelisted" | "disabled" | "unsupported" | "debugger-unavailable";

export interface TabStatusResponse {
  status: TabProtectionStatus;
  hostname: string;
  message: string;
}

export interface GetTabStatusMessage {
  type: "GET_TAB_STATUS";
  tabId: number;
}
