export function isValidTimezone(value: string): boolean {
  if (!value.trim()) return false;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
