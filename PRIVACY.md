# ZoneGuard Privacy Policy

ZoneGuard does not collect, upload, sell, or share browsing history, personal data, or website data. It has no server, account system, analytics, telemetry, tracking, advertising, or external API integration.

Tab URLs are read locally only to determine whether an enabled whitelist rule matches. The extension does not retain browsing history. The selected timezone, enabled state, and whitelist rules are stored in `chrome.storage.local` on the user's device. Exported settings remain on the device unless the user chooses to move the file.

When a tab matches an enabled rule, ZoneGuard uses Chrome's `chrome.debugger` API and the DevTools Protocol command `Emulation.setTimezoneOverride` to apply the selected timezone for that tab. No page script is injected to replace JavaScript date APIs.

The extension makes no runtime network requests. Updates to this policy will be included with future extension releases.
