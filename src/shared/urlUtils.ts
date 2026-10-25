export function isSupportedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hostnameFromUrl(value: string): string {
  if (!isSupportedUrl(value)) return "";
  return new URL(value).hostname.replace(/\.$/, "").toLowerCase();
}
