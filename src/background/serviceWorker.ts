import { DebuggerManager } from "./debuggerManager";
import { statusFromResult, TabReconciler } from "./tabReconciler";
import { isGetTabStatusMessage, errorTabStatus } from "../shared/messages";
import { SETTINGS_STORAGE_KEY } from "../shared/constants";
import { logger } from "../shared/logger";
import { SettingsService } from "../shared/settings";

const debuggerManager = new DebuggerManager();
const settingsService = new SettingsService();
const ready = Promise.all([debuggerManager.initialize(), settingsService.initialize()]).then(
  () => undefined,
);
const reconciler = new TabReconciler(debuggerManager, settingsService, ready);

function safelyReconcile(tabId: number, forceRetry = false): void {
  void reconciler.reconcileTab(tabId, forceRetry).catch((error: unknown) => {
    logger.error("Tab event reconciliation failed", tabId, error);
  });
}

function safelyReconcileAll(): void {
  void reconciler.reconcileAllTabs().catch((error: unknown) => {
    logger.error("Full tab reconciliation failed", error);
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined) safelyReconcile(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url !== undefined || changeInfo.status === "complete") {
    safelyReconcile(tabId, true);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void reconciler.forgetTab(tabId).catch((error: unknown) => {
    logger.error("Could not clean up closed tab", tabId, error);
  });
});

const reconcileMainFrame = (
  details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
): void => {
  if (details.frameId === 0) safelyReconcile(details.tabId, true);
};

chrome.webNavigation.onCommitted.addListener(reconcileMainFrame);
chrome.webNavigation.onHistoryStateUpdated.addListener(reconcileMainFrame);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(reconcileMainFrame);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && Object.hasOwn(changes, SETTINGS_STORAGE_KEY)) {
    safelyReconcileAll();
  }
});

chrome.runtime.onStartup.addListener(safelyReconcileAll);
chrome.runtime.onInstalled.addListener(safelyReconcileAll);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isGetTabStatusMessage(message)) return false;

  void reconciler
    .reconcileTab(message.tabId, true)
    .then((result) => sendResponse(statusFromResult(result)))
    .catch((error: unknown) => {
      logger.error("Could not read tab status", message.tabId, error);
      sendResponse(errorTabStatus());
    });
  return true;
});

void ready
  .then(() => reconciler.reconcileAllTabs())
  .catch((error: unknown) => logger.error("ZoneGuard startup failed", error));
