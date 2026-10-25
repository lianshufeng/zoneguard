import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../src/shared/constants";
import { SettingsService, SettingsValidationError } from "../src/shared/settings";

let store: Record<string, unknown>;

function installChromeMock(): void {
  const local = {
    get: vi.fn(async (key: string) => (Object.hasOwn(store, key) ? { [key]: store[key] } : {})),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
  };
  vi.stubGlobal("chrome", { storage: { local } } as unknown as typeof chrome);
}

describe("SettingsService", () => {
  beforeEach(() => {
    store = {};
    vi.unstubAllGlobals();
    installChromeMock();
  });

  it("initializes the requested defaults", async () => {
    const settings = await new SettingsService().getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(store[SETTINGS_STORAGE_KEY]).toEqual(DEFAULT_SETTINGS);
  });

  it("adds normalized rules, toggles them, and removes them", async () => {
    const service = new SettingsService();
    const rule = await service.addWhitelistRule("  EXAMPLE.COM  ");
    expect(rule.pattern).toBe("example.com");
    await service.updateWhitelistRule(rule.id, { enabled: false });
    expect((await service.getSettings()).whitelist[0]?.enabled).toBe(false);
    await service.removeWhitelistRule(rule.id);
    expect((await service.getSettings()).whitelist).toEqual([]);
  });

  it("prevents duplicate and invalid rules", async () => {
    const service = new SettingsService();
    await service.addWhitelistRule("example.com");
    await expect(service.addWhitelistRule("EXAMPLE.COM")).rejects.toThrow(
      "This rule already exists.",
    );
    await expect(service.addWhitelistRule("ftp://example.com/*")).rejects.toThrow(
      SettingsValidationError,
    );
    await expect(service.addWhitelistRule("   ")).rejects.toThrow(
      "Enter a valid domain or URL pattern.",
    );
  });

  it("rejects invalid timezone selections", async () => {
    await expect(new SettingsService().setTimezone("America/FakeCity")).rejects.toThrow(
      "Select a valid IANA timezone.",
    );
  });

  it("exports and securely imports version 1 settings", async () => {
    const service = new SettingsService();
    const imported = await service.importSettings(
      JSON.stringify({
        version: 1,
        enabled: false,
        timezone: "Asia/Tokyo",
        whitelist: [{ pattern: "*.example.com", enabled: true }],
      }),
    );
    expect(imported.enabled).toBe(false);
    expect(imported.timezone).toBe("Asia/Tokyo");
    expect(imported.whitelist[0]?.pattern).toBe("*.example.com");

    const exported = JSON.parse(await service.exportSettings()) as Record<string, unknown>;
    expect(exported).toMatchObject({ version: 1, enabled: false, timezone: "Asia/Tokyo" });
    expect(exported.whitelist).toEqual([{ pattern: "*.example.com", enabled: true }]);
  });

  it("rejects malformed imports and never accepts invalid imported rules", async () => {
    const service = new SettingsService();
    await expect(service.importSettings("{")).rejects.toThrow(
      "The settings file is not valid JSON.",
    );
    await expect(
      service.importSettings(
        JSON.stringify({
          version: 1,
          enabled: true,
          timezone: "America/New_York",
          whitelist: [{ pattern: "https://example.com.evil.com/*", enabled: "yes" }],
        }),
      ),
    ).rejects.toThrow("Invalid whitelist rule in import file.");
    await expect(
      service.importSettings(
        JSON.stringify({
          version: 1,
          enabled: true,
          timezone: "America/FakeCity",
          whitelist: [],
        }),
      ),
    ).rejects.toThrow("Select a valid IANA timezone.");
  });

  it("falls back safely when local storage is corrupted", async () => {
    store[SETTINGS_STORAGE_KEY] = {
      enabled: "yes",
      timezone: "Fake/Timezone",
      whitelist: [{ id: "bad", pattern: "example.com.evil.com", enabled: "yes" }],
      __proto__: { compromised: true },
    };
    const settings = await new SettingsService().getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(({} as { compromised?: boolean }).compromised).toBeUndefined();
  });
});
