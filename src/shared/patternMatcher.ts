import type { WhitelistRule } from "./types";
import { isSupportedUrl } from "./urlUtils";

const MAX_PATTERN_LENGTH = 2048;
const INVALID_PATTERN_MESSAGE = "Enter a valid domain or URL pattern.";
const UNSUPPORTED_PROTOCOL_MESSAGE = "Only HTTP and HTTPS URL patterns are supported.";

interface ParsedUrlPattern {
  protocol: "http" | "https" | "*";
  hostname: string;
  includeSubdomains: boolean;
  port: string;
  path: string;
}

interface ParsedDomainPattern {
  hostname: string;
  includeSubdomains: boolean;
}

export type PatternValidation = { valid: true; pattern: string } | { valid: false; error: string };

function normalizeHostname(hostname: string): string {
  return hostname.replace(/\.$/, "").toLowerCase();
}

function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) return false;
  return hostname
    .split(".")
    .every(
      (label) =>
        label.length > 0 && label.length <= 63 && /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label),
    );
}

function parseDomainPattern(value: string): ParsedDomainPattern | null {
  const includeSubdomains = value.startsWith("*.");
  const candidate = includeSubdomains ? value.slice(2) : value;
  if (!candidate || /[\s/?#:@*\\]/.test(candidate)) return null;

  try {
    const url = new URL(`https://${candidate}/`);
    const hostname = normalizeHostname(url.hostname);
    if (url.port || url.username || url.password || !isValidHostname(hostname)) return null;
    return { hostname, includeSubdomains };
  } catch {
    return null;
  }
}

function parseUrlPattern(value: string): ParsedUrlPattern | null {
  const match = /^([a-z][a-z\d+.-]*|\*):\/\/([^/?#]+)(.*)$/i.exec(value);
  if (!match) return null;

  const rawProtocol = (match[1] ?? "").toLowerCase();
  if (rawProtocol !== "http" && rawProtocol !== "https" && rawProtocol !== "*") return null;

  const authority = match[2] ?? "";
  const wildcard = authority.startsWith("*.");
  const hostAndPort = wildcard ? authority.slice(2) : authority;
  if (!hostAndPort || /[\s/@*\\]/.test(hostAndPort)) return null;

  let parsed: URL;
  try {
    const parserProtocol = rawProtocol === "http" ? "http" : "https";
    parsed = new URL(`${parserProtocol}://${hostAndPort}/`);
  } catch {
    return null;
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (parsed.username || parsed.password || !isValidHostname(hostname)) return null;

  const rawPath = match[3] ?? "";
  if ([...rawPath].some((character) => character.charCodeAt(0) <= 0x20 || character === "\\"))
    return null;
  const path = rawPath === "" ? "/" : rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  return {
    protocol: rawProtocol,
    hostname,
    includeSubdomains: wildcard,
    port: parsed.port,
    path,
  };
}

function parsePattern(value: string): ParsedUrlPattern | ParsedDomainPattern | null {
  if (value.includes("://")) return parseUrlPattern(value);
  return parseDomainPattern(value);
}

export function normalizePattern(input: string): string {
  const value = input.trim();
  const parsed = parsePattern(value);
  if (!parsed) return value;

  if ("protocol" in parsed) {
    const host = `${parsed.includeSubdomains ? "*." : ""}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
    return `${parsed.protocol}://${host}${parsed.path}`;
  }

  return `${parsed.includeSubdomains ? "*." : ""}${parsed.hostname}`;
}

export function validatePattern(input: string): PatternValidation {
  const value = input.trim();
  if (!value || value.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: INVALID_PATTERN_MESSAGE };
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
  if (hasScheme && !/^https?:\/\//i.test(value)) {
    return { valid: false, error: UNSUPPORTED_PROTOCOL_MESSAGE };
  }

  const parsed = parsePattern(value);
  if (!parsed) return { valid: false, error: INVALID_PATTERN_MESSAGE };
  return { valid: true, pattern: normalizePattern(value) };
}

export function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function hostnameMatches(hostname: string, pattern: ParsedDomainPattern): boolean {
  const candidate = normalizeHostname(hostname);
  return (
    candidate === pattern.hostname ||
    (pattern.includeSubdomains && candidate.endsWith(`.${pattern.hostname}`))
  );
}

export function matchPattern(urlValue: string, patternValue: string): boolean {
  if (!isSupportedUrl(urlValue)) return false;
  if (/%(?![0-9a-f]{2})/i.test(urlValue)) return false;
  const normalized = normalizePattern(patternValue);
  if (!validatePattern(normalized).valid) return false;

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return false;
  }

  const pattern = parsePattern(normalized);
  if (!pattern) return false;
  if (!("protocol" in pattern)) return hostnameMatches(url.hostname, pattern);

  if (pattern.protocol !== "*" && url.protocol !== `${pattern.protocol}:`) return false;
  if (url.port !== pattern.port || !hostnameMatches(url.hostname, pattern)) return false;

  const path = `${url.pathname}${url.search}${url.hash}`;
  return globToRegExp(pattern.path).test(path);
}

export function matchesAnyWhitelistRule(
  url: string,
  rules: readonly Pick<WhitelistRule, "pattern" | "enabled">[],
): boolean {
  return rules.some((rule) => rule.enabled && matchPattern(url, rule.pattern));
}
