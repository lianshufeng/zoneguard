import { describe, expect, it } from "vitest";
import { isValidTimezone } from "../src/shared/timezoneUtils";
import { searchTimezoneOptions, TIMEZONE_OPTIONS } from "../src/shared/timezones";

describe("IANA timezone support", () => {
  it("accepts valid IANA timezone identifiers", () => {
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Europe/London")).toBe(true);
    expect(isValidTimezone("Asia/Tokyo")).toBe(true);
  });

  it("rejects invalid and empty identifiers", () => {
    expect(isValidTimezone("Fake/Timezone")).toBe(false);
    expect(isValidTimezone("America/FakeCity")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });

  it("provides searchable city and region names with valid timezone IDs", () => {
    expect(
      searchTimezoneOptions("new york").some((option) => option.id === "America/New_York"),
    ).toBe(true);
    expect(
      searchTimezoneOptions("america").some((option) => option.id === "America/Los_Angeles"),
    ).toBe(true);
    expect(searchTimezoneOptions("japan").some((option) => option.id === "Asia/Tokyo")).toBe(true);
    expect(TIMEZONE_OPTIONS.length).toBeGreaterThan(40);
    expect(TIMEZONE_OPTIONS.every((option) => isValidTimezone(option.id))).toBe(true);
  });
});
