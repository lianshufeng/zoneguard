import { mountTimezoneCombobox } from "../shared/timezoneCombobox";
import { SettingsService } from "../shared/settings";
import { SettingsValidationError } from "../shared/settings";
import { applyI18n, localizeMessage, t } from "../shared/i18n";
import type { ZoneGuardSettings, WhitelistRule } from "../shared/types";

applyI18n();

const settingsService = new SettingsService();
const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing settings element: ${id}`);
  return element as T;
};

const enabledToggle = getElement<HTMLInputElement>("enabled-toggle");
const timezoneInput = getElement<HTMLInputElement>("timezone-search");
const timezoneOptions = getElement<HTMLUListElement>("timezone-options");
const ruleForm = getElement<HTMLFormElement>("rule-form");
const rulePattern = getElement<HTMLInputElement>("rule-pattern");
const ruleList = getElement<HTMLUListElement>("rule-list");
const emptyState = getElement<HTMLParagraphElement>("empty-state");
const ruleFeedback = getElement<HTMLParagraphElement>("rule-feedback");
const exportButton = getElement<HTMLButtonElement>("export-button");
const importButton = getElement<HTMLButtonElement>("import-button");
const importFile = getElement<HTMLInputElement>("import-file");
const dataFeedback = getElement<HTMLParagraphElement>("data-feedback");

let settings: ZoneGuardSettings;
let timezoneCombobox: ReturnType<typeof mountTimezoneCombobox>;

function setFeedback(element: HTMLElement, message: string, isError = false): void {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function renderRules(rules: readonly WhitelistRule[]): void {
  ruleList.replaceChildren();
  emptyState.hidden = rules.length > 0;

  for (const rule of rules) {
    const row = document.createElement("li");
    row.className = "rule-row";

    const label = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = rule.enabled;
    toggle.setAttribute("aria-label", t("enableRule", { pattern: rule.pattern }));
    const pattern = document.createElement("span");
    pattern.className = "rule-pattern";
    pattern.textContent = rule.pattern;
    label.append(toggle, pattern);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = t("remove");
    remove.setAttribute("aria-label", t("removeRule", { pattern: rule.pattern }));

    toggle.addEventListener("change", () => {
      toggle.disabled = true;
      void settingsService
        .updateWhitelistRule(rule.id, { enabled: toggle.checked })
        .then(async () => {
          settings = await settingsService.getSettings();
          renderRules(settings.whitelist);
          setFeedback(ruleFeedback, toggle.checked ? t("ruleEnabled") : t("ruleDisabledFeedback"));
        })
        .catch(() => {
          toggle.checked = rule.enabled;
          toggle.disabled = false;
          setFeedback(ruleFeedback, t("unableToUpdateRule"), true);
        });
    });

    remove.addEventListener("click", () => {
      remove.disabled = true;
      void settingsService
        .removeWhitelistRule(rule.id)
        .then(async () => {
          settings = await settingsService.getSettings();
          renderRules(settings.whitelist);
          setFeedback(ruleFeedback, t("ruleRemoved"));
        })
        .catch(() => {
          remove.disabled = false;
          setFeedback(ruleFeedback, t("unableToRemoveRule"), true);
        });
    });

    row.append(label, remove);
    ruleList.append(row);
  }
}

function renderSettings(next: ZoneGuardSettings): void {
  settings = next;
  enabledToggle.checked = next.enabled;
  timezoneCombobox?.setSelected(next.timezone);
  renderRules(next.whitelist);
}

enabledToggle.addEventListener("change", () => {
  enabledToggle.disabled = true;
  void settingsService
    .setEnabled(enabledToggle.checked)
    .then((next) => {
      renderSettings(next);
    })
    .catch(() => {
      enabledToggle.checked = settings.enabled;
      setFeedback(ruleFeedback, t("unableToUpdateZoneGuard"), true);
    })
    .finally(() => {
      enabledToggle.disabled = false;
    });
});

ruleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pattern = rulePattern.value;
  const submit = ruleForm.querySelector<HTMLButtonElement>("button[type='submit']");
  if (submit) submit.disabled = true;
  void settingsService
    .addWhitelistRule(pattern)
    .then(async () => {
      rulePattern.value = "";
      settings = await settingsService.getSettings();
      renderRules(settings.whitelist);
      setFeedback(ruleFeedback, t("ruleAdded"));
    })
    .catch((error: unknown) => {
      const message =
        error instanceof SettingsValidationError
          ? localizeMessage(error.message)
          : t("unableToAddRule");
      setFeedback(ruleFeedback, message, true);
      rulePattern.focus();
    })
    .finally(() => {
      if (submit) submit.disabled = false;
    });
});

exportButton.addEventListener("click", () => {
  exportButton.disabled = true;
  void settingsService
    .exportSettings()
    .then((json) => {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "zoneguard-settings.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setFeedback(dataFeedback, t("settingsExported"));
    })
    .catch(() => setFeedback(dataFeedback, t("unableToExportSettings"), true))
    .finally(() => {
      exportButton.disabled = false;
    });
});

importButton.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (!file) return;
  importButton.disabled = true;
  void file
    .text()
    .then((json) => settingsService.importSettings(json))
    .then((next) => {
      renderSettings(next);
      setFeedback(dataFeedback, t("settingsImported"));
      setFeedback(ruleFeedback, "");
    })
    .catch((error: unknown) => {
      setFeedback(
        dataFeedback,
        error instanceof SettingsValidationError
          ? localizeMessage(error.message)
          : t("unableToImportSettings"),
        true,
      );
    })
    .finally(() => {
      importButton.disabled = false;
      importFile.value = "";
    });
});

async function initialize(): Promise<void> {
  settings = await settingsService.getSettings();
  timezoneCombobox = mountTimezoneCombobox(
    timezoneInput,
    timezoneOptions,
    settings.timezone,
    (timezone) => {
      void settingsService
        .setTimezone(timezone)
        .then(renderSettings)
        .catch(() => {
          timezoneCombobox.setSelected(settings.timezone);
          setFeedback(dataFeedback, t("selectValidTimezone"), true);
        });
    },
  );
  renderSettings(settings);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !Object.hasOwn(changes, "zoneguard.settings")) return;
  void settingsService
    .getSettings()
    .then(renderSettings)
    .catch(() => setFeedback(dataFeedback, t("unableToLoadSettings"), true));
});

void initialize().catch(() => setFeedback(dataFeedback, t("unableToLoadSettings"), true));
