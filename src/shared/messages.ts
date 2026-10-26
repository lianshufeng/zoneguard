import type { GetTabStatusMessage, TabStatusResponse } from "./types";
import { t } from "./i18n";

export function isGetTabStatusMessage(value: unknown): value is GetTabStatusMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === "GET_TAB_STATUS" &&
    typeof record.tabId === "number" &&
    Number.isInteger(record.tabId) &&
    record.tabId >= 0
  );
}

export function errorTabStatus(): TabStatusResponse {
  return {
    status: "debugger-unavailable",
    hostname: "",
    message: t("unableToCheckTabTimezone"),
  };
}
