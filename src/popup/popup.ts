import { mountTimezoneCombobox } from "../shared/timezoneCombobox";
import { SettingsService } from "../shared/settings";
import { matchPattern } from "../shared/patternMatcher";
import { isSupportedUrl } from "../shared/urlUtils";
import type { TabStatusResponse, ZoneGuardSettings } from "../shared/types";

const settingsService = new SettingsService();
const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing popup element: ${id}`);
  return element as T;
};

const enabledToggle = getElement<HTMLInputElement>("enabled-toggle");
const enabledLabel = getElement<HTMLSpanElement>("enabled-label");
const timezoneInput = getElement<HTMLInputElement>("timezone-search");
const timezoneOptions = getElement<HTMLUListElement>("timezone-options");
const siteStatus = getElement<HTMLSpanElement>("site-status");
const siteHost = getElement<HTMLElement>("site-host");
const siteMessage = getElement<HTMLParagraphElement>("site-message");
const addSiteButton = getElement<HTMLButtonElement>("add-site");
const manageCurrentButton = getElement<HTMLButtonElement>("manage-current");
const feedback = getElement<HTMLParagraphElement>("feedback");
const manageButton = getElement<HTMLButtonElement>("manage-whitelist");

let settings: ZoneGuardSettings;
let selectedTabId: number | undefined;
let currentUrl = "";
let timezoneCombobox: ReturnType<typeof mountTimezoneCombobox>;
let statusRevision = 0;

function showFeedback(message: string, isError = false): void {
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

function updateEnabledControl(enabled: boolean): void {
  enabledToggle.checked = enabled;
  enabledLabel.textContent = enabled ? "On" : "Off";
}

function matchingRule(url: string): ZoneGuardSettings["whitelist"][number] | undefined {
  return settings.whitelist.find((rule) => matchPattern(url, rule.pattern));
}

function presentStatus(response: TabStatusResponse): void {
  siteHost.textContent =
    response.hostname || (response.status === "unsupported" ? "Unsupported page" : "—");
  const rule = currentUrl ? matchingRule(currentUrl) : undefined;
  const disabledRule = rule && !rule.enabled;
  const label =
    disabledRule && response.status === "not-whitelisted"
      ? "Rule disabled"
      : {
          protected: "Protected",
          "not-whitelisted": "Not in whitelist",
          disabled: "Off",
          unsupported: "Unsupported page",
          "debugger-unavailable": "Debugger unavailable",
        }[response.status];

  siteStatus.textContent = label;
  siteStatus.classList.toggle("is-protected", response.status === "protected");
  siteStatus.classList.toggle("is-error", response.status === "debugger-unavailable");
  siteMessage.textContent =
    disabledRule && response.status === "not-whitelisted"
      ? "A matching rule is disabled. Enable it in your whitelist to protect this site."
      : response.message;

  const supported = Boolean(currentUrl && isSupportedUrl(currentUrl));
  addSiteButton.hidden = !supported || Boolean(rule);
  manageCurrentButton.hidden = !rule;
  if (rule)
    manageCurrentButton.textContent = disabledRule ? "Manage disabled rule" : "Manage whitelist";
}

async function refreshStatus(): Promise<void> {
  const revision = ++statusRevision;
  try {
    if (selectedTabId === undefined) {
      currentUrl = "";
      presentStatus({
        status: "unsupported",
        hostname: "",
        message: "No active tab is available.",
      });
      return;
    }
    const tab = await chrome.tabs.get(selectedTabId);
    currentUrl = tab.url ?? "";
    const response = (await chrome.runtime.sendMessage({
      type: "GET_TAB_STATUS",
      tabId: selectedTabId,
    })) as TabStatusResponse;
    if (revision !== statusRevision) return;
    presentStatus(response);
  } catch {
    if (revision !== statusRevision) return;
    presentStatus({
      status: "debugger-unavailable",
      hostname: "",
      message: "Unable to check this tab's timezone status.",
    });
  }
}

async function openOptions(): Promise<void> {
  try {
    await chrome.runtime.openOptionsPage();
  } catch {
    showFeedback("Unable to open settings.", true);
  }
}

enabledToggle.addEventListener("change", () => {
  enabledToggle.disabled = true;
  void settingsService
    .setEnabled(enabledToggle.checked)
    .then((next) => {
      settings = next;
      updateEnabledControl(next.enabled);
      showFeedback(next.enabled ? "Protection is on." : "Protection is off.");
    })
    .catch(() => {
      updateEnabledControl(settings.enabled);
      showFeedback("Unable to update ZoneGuard.", true);
    })
    .finally(() => {
      enabledToggle.disabled = false;
      void refreshStatus();
    });
});

manageButton.addEventListener("click", () => void openOptions());
manageCurrentButton.addEventListener("click", () => void openOptions());

addSiteButton.addEventListener("click", () => {
  const hostname = new URL(currentUrl).hostname.replace(/\.$/, "").toLowerCase();
  addSiteButton.disabled = true;
  void settingsService
    .addWhitelistRule(hostname)
    .then(() => {
      showFeedback(`${hostname} added to your whitelist.`);
      return settingsService.getSettings();
    })
    .then((next) => {
      settings = next;
      return refreshStatus();
    })
    .catch((error: unknown) => {
      showFeedback(error instanceof Error ? error.message : "Unable to add this site.", true);
    })
    .finally(() => {
      addSiteButton.disabled = false;
    });
});

async function initialize(): Promise<void> {
  settings = await settingsService.getSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  selectedTabId = tab?.id;
  updateEnabledControl(settings.enabled);
  timezoneCombobox = mountTimezoneCombobox(
    timezoneInput,
    timezoneOptions,
    settings.timezone,
    (timezone) => {
      void settingsService
        .setTimezone(timezone)
        .then((next) => {
          settings = next;
          showFeedback("Timezone updated.");
          void refreshStatus();
        })
        .catch(() => {
          timezoneCombobox.setSelected(settings.timezone);
          showFeedback("Select a valid IANA timezone.", true);
        });
    },
  );
  await refreshStatus();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !Object.hasOwn(changes, "zoneguard.settings")) return;
  void settingsService
    .getSettings()
    .then((next) => {
      settings = next;
      updateEnabledControl(next.enabled);
      timezoneCombobox?.setSelected(next.timezone);
      void refreshStatus();
    })
    .catch(() => showFeedback("Unable to load your settings.", true));
});

void initialize().catch(() => showFeedback("Unable to load ZoneGuard settings.", true));
