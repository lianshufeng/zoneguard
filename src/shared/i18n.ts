export type Locale = "en" | "zh";

const english = {
  extensionName: "ZoneGuard",
  timezoneControlBySite: "Timezone control by site",
  on: "On",
  globalSettings: "Global settings",
  toggleZoneGuard: "Turn ZoneGuard on or off",
  loading: "Loading…",
  timezone: "Timezone",
  currentSite: "Current site",
  checking: "Checking…",
  addToWhitelist: "Add to whitelist",
  manageWhitelist: "Manage whitelist",
  manageDisabledRule: "Manage disabled rule",
  unsupportedPage: "Unsupported page",
  ruleDisabled: "Rule disabled",
  protected: "Protected",
  notInWhitelist: "Not in whitelist",
  off: "Off",
  debuggerUnavailable: "Debugger unavailable",
  matchingRuleDisabled:
    "A matching rule is disabled. Enable it in your whitelist to protect this site.",
  noActiveTab: "No active tab is available.",
  unableToCheckTabTimezone: "Unable to check this tab's timezone status.",
  unableToOpenSettings: "Unable to open settings.",
  protectionOn: "Protection is on.",
  protectionOff: "Protection is off.",
  unableToUpdateZoneGuard: "Unable to update ZoneGuard.",
  siteAddedToWhitelist: "{hostname} added to your whitelist.",
  unableToAddSite: "Unable to add this site.",
  timezoneUpdated: "Timezone updated.",
  selectValidTimezone: "Select a valid IANA timezone.",
  unableToLoadSettings: "Unable to load your settings.",
  pageCannotBeControlled: "This page cannot be controlled by ZoneGuard.",
  zoneGuardOff: "ZoneGuard is turned off.",
  siteNotInWhitelist: "This site is not in your whitelist.",
  timezoneOverrideActive: "Timezone override is active for this tab.",
  unableToApplyTimezone: "Unable to apply timezone to this tab.",
  anotherDebuggerAttached: "Another debugger may already be attached to this tab.",
  debuggerDisconnected: "The debugger session was disconnected.",
  debuggerSessionUnavailable: "The debugger session is unavailable.",
  noTimezonesFound: "No timezones found.",
  utcOffsetUnavailable: "UTC offset unavailable",
  enableRule: "Enable {pattern}",
  removeRule: "Remove {pattern}",
  remove: "Remove",
  ruleEnabled: "Rule enabled.",
  ruleDisabledFeedback: "Rule disabled.",
  unableToUpdateRule: "Unable to update this rule.",
  ruleRemoved: "Rule removed.",
  unableToRemoveRule: "Unable to remove this rule.",
  ruleAdded: "Rule added.",
  unableToAddRule: "Unable to add this rule.",
  settingsExported: "Settings exported.",
  unableToExportSettings: "Unable to export settings.",
  settingsImported: "Settings imported.",
  unableToImportSettings: "Unable to import these settings.",
  invalidPattern: "Enter a valid domain or URL pattern.",
  unsupportedProtocol: "Only HTTP and HTTPS URL patterns are supported.",
  ruleAlreadyExists: "This rule already exists.",
  invalidEnabledSetting: "Invalid enabled setting.",
  invalidRuleState: "Invalid rule state.",
  ruleNoLongerExists: "This rule no longer exists.",
  invalidSettingsJson: "The settings file is not valid JSON.",
  unsupportedSettingsFormat: "Unsupported settings file format.",
  invalidImportEnabledSetting: "Invalid enabled setting in import file.",
  invalidWhitelist: "Invalid whitelist in import file.",
  invalidWhitelistRule: "Invalid whitelist rule in import file.",
  settingsTitle: "ZoneGuard Settings",
  manageTimezoneAccess: "Manage timezone and website access",
  general: "General",
  protection: "Protection",
  timezoneOverrideNotice: "Timezone overrides are active only for enabled whitelist rules.",
  chooseTimezone: "Choose a timezone",
  timezoneSearchHelp:
    "Search by city, country, region, IANA timezone ID, or UTC offset. Offsets reflect the current date; daylight saving time is handled automatically.",
  whitelist: "Whitelist",
  websiteRules: "Website rules",
  whitelistNotice: "Only websites that match an enabled rule can receive a timezone override.",
  domainUrlPattern: "Domain or URL pattern",
  addRule: "Add rule",
  examples: "Examples:",
  noWhitelistedWebsites: "No websites are whitelisted yet.",
  whitelistEmptyBody: "ZoneGuard will not modify any website until you add a rule.",
  whitelistRules: "Whitelist rules",
  settingsData: "Settings data",
  importExport: "Import and export",
  localSettingsNotice:
    "Your settings are stored locally in Chrome. Export a backup or import a version 1 JSON file.",
  exportSettings: "Export settings",
  importSettings: "Import settings",
  about: "About",
  privacyNote: "Read the bundled PRIVACY.md for the full privacy policy.",
  aboutDescription:
    "Timezone control by site. ZoneGuard uses Chrome DevTools Protocol and stores settings on this device only.",
} as const;

type TranslationKey = keyof typeof english;

const chinese: Record<TranslationKey, string> = {
  extensionName: "ZoneGuard",
  timezoneControlBySite: "按网站控制时区",
  on: "已开启",
  globalSettings: "全局设置",
  toggleZoneGuard: "开启或关闭 ZoneGuard",
  loading: "加载中…",
  timezone: "时区",
  currentSite: "当前网站",
  checking: "检查中…",
  addToWhitelist: "加入白名单",
  manageWhitelist: "管理白名单",
  manageDisabledRule: "管理已停用规则",
  unsupportedPage: "不支持的页面",
  ruleDisabled: "规则已停用",
  protected: "已保护",
  notInWhitelist: "不在白名单中",
  off: "已关闭",
  debuggerUnavailable: "调试器不可用",
  matchingRuleDisabled: "匹配的规则已停用。请在白名单中启用它来保护此网站。",
  noActiveTab: "当前没有可用的活动标签页。",
  unableToCheckTabTimezone: "无法检查此标签页的时区状态。",
  unableToOpenSettings: "无法打开设置。",
  protectionOn: "保护已开启。",
  protectionOff: "保护已关闭。",
  unableToUpdateZoneGuard: "无法更新 ZoneGuard。",
  siteAddedToWhitelist: "{hostname} 已加入白名单。",
  unableToAddSite: "无法添加此网站。",
  timezoneUpdated: "时区已更新。",
  selectValidTimezone: "请选择有效的 IANA 时区。",
  unableToLoadSettings: "无法加载设置。",
  pageCannotBeControlled: "ZoneGuard 无法控制此页面。",
  zoneGuardOff: "ZoneGuard 已关闭。",
  siteNotInWhitelist: "此网站不在白名单中。",
  timezoneOverrideActive: "此标签页的时区覆盖已生效。",
  unableToApplyTimezone: "无法对该标签页应用时区。",
  anotherDebuggerAttached: "此标签页可能已连接了其他调试器。",
  debuggerDisconnected: "调试器会话已断开。",
  debuggerSessionUnavailable: "调试器会话不可用。",
  noTimezonesFound: "未找到时区。",
  utcOffsetUnavailable: "UTC 偏移不可用",
  enableRule: "启用 {pattern}",
  removeRule: "移除 {pattern}",
  remove: "移除",
  ruleEnabled: "规则已启用。",
  ruleDisabledFeedback: "规则已停用。",
  unableToUpdateRule: "无法更新此规则。",
  ruleRemoved: "规则已移除。",
  unableToRemoveRule: "无法移除此规则。",
  ruleAdded: "规则已添加。",
  unableToAddRule: "无法添加此规则。",
  settingsExported: "设置已导出。",
  unableToExportSettings: "无法导出设置。",
  settingsImported: "设置已导入。",
  unableToImportSettings: "无法导入这些设置。",
  invalidPattern: "请输入有效的域名或 URL 规则。",
  unsupportedProtocol: "只支持 HTTP 和 HTTPS URL 规则。",
  ruleAlreadyExists: "此规则已存在。",
  invalidEnabledSetting: "启用状态无效。",
  invalidRuleState: "规则状态无效。",
  ruleNoLongerExists: "此规则已不存在。",
  invalidSettingsJson: "设置文件不是有效的 JSON。",
  unsupportedSettingsFormat: "不支持的设置文件格式。",
  invalidImportEnabledSetting: "导入文件中的启用状态无效。",
  invalidWhitelist: "导入文件中的白名单无效。",
  invalidWhitelistRule: "导入文件中的白名单规则无效。",
  settingsTitle: "ZoneGuard 设置",
  manageTimezoneAccess: "管理时区和网站访问",
  general: "常规",
  protection: "保护",
  timezoneOverrideNotice: "仅对启用的白名单规则应用时区覆盖。",
  chooseTimezone: "选择时区",
  timezoneSearchHelp:
    "可按城市、国家、地区、IANA 时区 ID 或 UTC 偏移搜索。偏移按当前日期计算；夏令时自动处理。",
  whitelist: "白名单",
  websiteRules: "网站规则",
  whitelistNotice: "只有匹配启用规则的网站才会应用时区覆盖。",
  domainUrlPattern: "域名或 URL 规则",
  addRule: "添加规则",
  examples: "示例：",
  noWhitelistedWebsites: "尚未添加白名单网站。",
  whitelistEmptyBody: "添加规则前，ZoneGuard 不会修改任何网站。",
  whitelistRules: "白名单规则",
  settingsData: "设置数据",
  importExport: "导入和导出",
  localSettingsNotice: "设置仅存储在 Chrome 本地。你可以导出备份或导入版本 1 的 JSON 文件。",
  exportSettings: "导出设置",
  importSettings: "导入设置",
  about: "关于",
  privacyNote: "完整隐私政策请阅读随附的 PRIVACY.md。",
  aboutDescription:
    "按网站控制时区。ZoneGuard 使用 Chrome DevTools Protocol，仅在本设备上存储设置。",
};

const catalogs = { en: english, zh: chinese };

const language =
  typeof navigator === "undefined" ? "" : navigator.language || navigator.languages?.[0] || "";

export const locale: Locale = /^zh(?:-|$)/i.test(language) ? "zh" : "en";

export function t(key: TranslationKey, values: Record<string, string> = {}): string {
  const template = catalogs[locale][key] ?? english[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

const errorKeys: Partial<Record<string, TranslationKey>> = {
  "Enter a valid domain or URL pattern.": "invalidPattern",
  "Only HTTP and HTTPS URL patterns are supported.": "unsupportedProtocol",
  "This rule already exists.": "ruleAlreadyExists",
  "Invalid enabled setting.": "invalidEnabledSetting",
  "Invalid rule state.": "invalidRuleState",
  "This rule no longer exists.": "ruleNoLongerExists",
  "The settings file is not valid JSON.": "invalidSettingsJson",
  "Unsupported settings file format.": "unsupportedSettingsFormat",
  "Invalid enabled setting in import file.": "invalidImportEnabledSetting",
  "Invalid whitelist in import file.": "invalidWhitelist",
  "Invalid whitelist rule in import file.": "invalidWhitelistRule",
};

export function localizeMessage(message: string): string {
  const key = errorKeys[message];
  return key ? t(key) : message;
}

export function applyI18n(root: ParentNode = document): void {
  const documentElement =
    root instanceof Document ? root.documentElement : document.documentElement;
  documentElement.lang = locale === "zh" ? "zh-CN" : "en";

  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as TranslationKey | undefined;
    if (key) element.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder as TranslationKey | undefined;
    if (key) element.setAttribute("placeholder", t(key));
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel as TranslationKey | undefined;
    if (key) element.setAttribute("aria-label", t(key));
  });
}
