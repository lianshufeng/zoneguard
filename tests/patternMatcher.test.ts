import { describe, expect, it } from "vitest";
import {
  globToRegExp,
  matchPattern,
  matchesAnyWhitelistRule,
  normalizePattern,
  validatePattern,
} from "../src/shared/patternMatcher";

describe("domain whitelist patterns", () => {
  it("matches a domain on HTTP and HTTPS without crossing hostname boundaries", () => {
    expect(matchPattern("https://example.com", "example.com")).toBe(true);
    expect(matchPattern("http://example.com/test", "example.com")).toBe(true);
    expect(matchPattern("https://notexample.com", "example.com")).toBe(false);
    expect(matchPattern("https://evil-example.com", "example.com")).toBe(false);
    expect(matchPattern("https://example.com.evil.com", "example.com")).toBe(false);
  });

  it("includes the root host and any number of subdomain labels for *.example.com", () => {
    for (const url of [
      "https://example.com",
      "https://www.example.com",
      "https://api.example.com",
      "https://a.b.example.com",
    ]) {
      expect(matchPattern(url, "*.example.com")).toBe(true);
    }
    expect(matchPattern("https://example.org", "*.example.com")).toBe(false);
    expect(matchPattern("https://evil-example.com", "*.example.com")).toBe(false);
    expect(matchPattern("https://example.com.evil.org", "*.example.com")).toBe(false);
  });

  it("matches URL globs by scheme, host, port, path, query, and fragment", () => {
    const pattern = "https://*.example.com/account/*";
    expect(matchPattern("https://example.com/account/", pattern)).toBe(true);
    expect(matchPattern("https://app.example.com/account/profile?tab=1#security", pattern)).toBe(
      true,
    );
    expect(matchPattern("http://example.com/account/profile", pattern)).toBe(false);
    expect(matchPattern("https://example.com/admin", pattern)).toBe(false);
    expect(matchPattern("https://example.com.evil.com/account/profile", pattern)).toBe(false);
    expect(matchPattern("https://example.com:8443/account/profile", pattern)).toBe(false);
  });

  it("supports protocol wildcards for HTTP and HTTPS", () => {
    const pattern = "*://*.example.com/*";
    expect(matchPattern("http://example.com", pattern)).toBe(true);
    expect(matchPattern("https://www.example.com/page", pattern)).toBe(true);
    expect(matchPattern("ftp://example.com/page", pattern)).toBe(false);
  });

  it("treats glob characters as literals except for asterisk", () => {
    expect(globToRegExp("/a.b+?^${}()|[]\\*end").test("/a.b+?^${}()|[]\\anythingend")).toBe(true);
    expect(globToRegExp("/a.b+?^${}()|[]\\*end").test("/axb+?^${}()|[]\\anythingend")).toBe(false);
    expect(matchPattern("https://example.com/a.b+()", "https://example.com/a.b+()")).toBe(true);
  });

  it("normalizes host casing and trailing whitespace while preserving path case", () => {
    expect(normalizePattern("  HTTPS://EXAMPLE.COM/Account/*  ")).toBe(
      "https://example.com/Account/*",
    );
    expect(normalizePattern(" EXAMPLE.COM ")).toBe("example.com");
    expect(
      matchPattern("https://example.com/account/profile", "https://example.com/Account/*"),
    ).toBe(false);
  });

  it("rejects malformed, empty, unsupported, and overlong patterns", () => {
    expect(validatePattern("").valid).toBe(false);
    expect(validatePattern("   ").valid).toBe(false);
    expect(validatePattern("https://").valid).toBe(false);
    expect(validatePattern("ftp://example.com/*")).toEqual({
      valid: false,
      error: "Only HTTP and HTTPS URL patterns are supported.",
    });
    expect(validatePattern(`${"a".repeat(2049)}.com`).valid).toBe(false);
    expect(matchPattern("not a URL", "example.com")).toBe(false);
    expect(matchPattern("chrome://settings", "*://*/*")).toBe(false);
  });

  it("keeps rules disabled by default from matching and treats an empty whitelist as none", () => {
    expect(matchesAnyWhitelistRule("https://example.com", [])).toBe(false);
    expect(
      matchesAnyWhitelistRule("https://example.com", [{ pattern: "example.com", enabled: false }]),
    ).toBe(false);
    expect(
      matchesAnyWhitelistRule("https://example.com", [{ pattern: "example.com", enabled: true }]),
    ).toBe(true);
  });

  it("handles query strings, fragments, uppercase hosts, explicit ports, and malformed URLs", () => {
    expect(matchPattern("HTTPS://EXAMPLE.COM/path?x=1#part", "example.com")).toBe(true);
    expect(
      matchPattern("https://example.com/account/profile?tab=1", "https://example.com/account/*"),
    ).toBe(true);
    expect(matchPattern("https://example.com:8443/", "example.com")).toBe(true);
    expect(matchPattern("https://example.com:8443/", "https://example.com/*")).toBe(false);
    expect(matchPattern("http://example.com:80/", "http://example.com:80/*")).toBe(true);
    expect(normalizePattern("http://example.com:80/*")).toBe("http://example.com/*");
    expect(matchPattern("https://[::1]/", "example.com")).toBe(false);
    expect(matchPattern("https://example.com/%zz", "example.com")).toBe(false);
  });
});
