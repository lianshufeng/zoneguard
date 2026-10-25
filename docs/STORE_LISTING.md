# Chrome Web Store Listing Notes

## Single purpose

ZoneGuard lets users choose an IANA timezone and apply it to browser tabs whose URLs match the user's enabled local whitelist rules.

## Permission justifications

- **debugger:** Required to attach only to matching tabs and issue the Chrome DevTools Protocol command `Emulation.setTimezoneOverride`. Chrome's timezone emulation is exposed through this API. A debugger indicator may be shown while a tab is controlled.
- **storage:** Required to save the enabled state, selected timezone, whitelist, and a conservative local journal of tabs controlled by ZoneGuard. Settings remain in `chrome.storage.local`.
- **tabs:** Required to inspect current tab URLs and show the current site's whitelist and protection state. URL values are processed locally.
- **webNavigation:** Required to reconcile normal navigation and SPA history/fragment URL changes so timezone overrides stop when a tab leaves a matching URL.

No `<all_urls>` host permission is requested.

## Privacy statement

ZoneGuard does not collect, transmit, sell, or share browsing history, personal data, or website data. It has no server, account, analytics, telemetry, tracking, advertisements, or runtime network requests. URLs are processed locally for whitelist matching. Settings are stored in `chrome.storage.local`.
