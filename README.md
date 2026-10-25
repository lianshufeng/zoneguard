# ZoneGuard

ZoneGuard controls the timezone reported by Chrome on selected websites. Add one or more whitelist rules, choose an IANA timezone, and the override is applied only to matching tabs.

## Features

- Per-tab timezone override through Chrome DevTools Protocol.
- Searchable IANA timezone selection.
- Domain, subdomain wildcard, protocol wildcard, and URL path rules.
- Local-only settings with JSON import and export.
- Manifest V3 extension with no analytics, remote code, or external API calls.

An empty whitelist protects no websites. Websites that do not match an enabled rule keep the system timezone.

## Development

Requires Node.js 24 LTS and npm.

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run dev` watches source files and writes the loadable extension to `dist/`.

## Load unpacked in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project's `dist/` directory.

## Whitelist patterns

| Pattern                         | Matches                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| `example.com`                   | The exact hostname on HTTP or HTTPS, on any path and port.               |
| `*.example.com`                 | `example.com` and its subdomains, including nested subdomains.           |
| `https://app.example.com/*`     | HTTPS on that host and any path. An omitted port means the default port. |
| `https://example.com/account/*` | HTTPS pages whose path is under `/account/`.                             |
| `*://*.example.com/*`           | HTTP or HTTPS on the root host or any subdomain.                         |

Host comparisons use parsed URL hostnames and label boundaries. For example, `example.com` does not match `example.com.evil.com` or `evil-example.com`. URL path matching is case-sensitive. Rules can be disabled without deleting them.

## Permissions

- **debugger** — attaches to matching tabs and sends `Emulation.setTimezoneOverride` through Chrome DevTools Protocol. Chrome may display a debugging notification while a tab is controlled. This permission is powerful and is required for the actual timezone emulation.
- **storage** — keeps the selected timezone, enabled state, and whitelist in `chrome.storage.local`.
- **tabs** — reads the active tab URL and current tab URLs to evaluate whitelist rules and update the popup status.
- **webNavigation** — detects normal navigation and SPA history or fragment URL changes so a tab is detached promptly when it leaves the whitelist.

ZoneGuard does not request `<all_urls>` host permissions. No URL or settings data is sent to a server.

## Debugger conflicts and restrictions

Chrome DevTools or another debugging session can prevent ZoneGuard from attaching. The popup reports **Debugger unavailable** and explains that another debugger may already be attached. ZoneGuard does not repeatedly retry in the background; a navigation, settings update, or opening the popup can trigger another attempt.

Chrome internal pages, extension pages, DevTools pages, and other non-HTTP(S) pages cannot be controlled. See [technical limitations](docs/TECHNICAL_LIMITATIONS.md) for service worker recovery and other browser constraints.

## Import and export

Settings are exported as a version 1 JSON file containing the global enabled state, IANA timezone, and whitelist rules. Imports are validated locally before replacing current settings. Rule IDs and creation timestamps are regenerated and are not exported.

## Privacy

ZoneGuard has no account, server, analytics, telemetry, tracking, advertising, or runtime network requests. See [PRIVACY.md](PRIVACY.md).
