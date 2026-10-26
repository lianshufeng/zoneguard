import type { TimezoneOption } from "./types";
import { locale, t } from "./i18n";

const featured: Record<string, Omit<TimezoneOption, "id" | "label">> = {
  "America/New_York": {
    city: "New York",
    country: "United States",
    keywords: ["usa", "us", "eastern"],
  },
  "America/Los_Angeles": {
    city: "Los Angeles",
    country: "United States",
    keywords: ["usa", "us", "pacific"],
  },
  "America/Chicago": {
    city: "Chicago",
    country: "United States",
    keywords: ["usa", "us", "central"],
  },
  "America/Denver": {
    city: "Denver",
    country: "United States",
    keywords: ["usa", "us", "mountain"],
  },
  "America/Toronto": { city: "Toronto", country: "Canada", keywords: ["eastern"] },
  "America/Vancouver": { city: "Vancouver", country: "Canada", keywords: ["pacific"] },
  "America/Mexico_City": { city: "Mexico City", country: "Mexico", keywords: [] },
  "America/Sao_Paulo": { city: "São Paulo", country: "Brazil", keywords: [] },
  "America/Argentina/Buenos_Aires": { city: "Buenos Aires", country: "Argentina", keywords: [] },
  "Europe/London": { city: "London", country: "United Kingdom", keywords: ["uk", "gmt"] },
  "Europe/Paris": { city: "Paris", country: "France", keywords: [] },
  "Europe/Berlin": { city: "Berlin", country: "Germany", keywords: [] },
  "Europe/Madrid": { city: "Madrid", country: "Spain", keywords: [] },
  "Europe/Rome": { city: "Rome", country: "Italy", keywords: [] },
  "Europe/Amsterdam": { city: "Amsterdam", country: "Netherlands", keywords: [] },
  "Europe/Zurich": { city: "Zurich", country: "Switzerland", keywords: [] },
  "Europe/Stockholm": { city: "Stockholm", country: "Sweden", keywords: [] },
  "Europe/Warsaw": { city: "Warsaw", country: "Poland", keywords: [] },
  "Europe/Istanbul": { city: "Istanbul", country: "Turkey", keywords: [] },
  "Europe/Moscow": { city: "Moscow", country: "Russia", keywords: [] },
  "Asia/Tokyo": { city: "Tokyo", country: "Japan", keywords: [] },
  "Asia/Shanghai": { city: "Shanghai", country: "China", keywords: [] },
  "Asia/Hong_Kong": { city: "Hong Kong", country: "China", keywords: [] },
  "Asia/Singapore": { city: "Singapore", country: "Singapore", keywords: [] },
  "Asia/Seoul": { city: "Seoul", country: "South Korea", keywords: [] },
  "Asia/Taipei": { city: "Taipei", country: "Taiwan", keywords: [] },
  "Asia/Bangkok": { city: "Bangkok", country: "Thailand", keywords: [] },
  "Asia/Jakarta": { city: "Jakarta", country: "Indonesia", keywords: [] },
  "Asia/Manila": { city: "Manila", country: "Philippines", keywords: [] },
  "Asia/Kuala_Lumpur": { city: "Kuala Lumpur", country: "Malaysia", keywords: [] },
  "Asia/Kolkata": { city: "Kolkata", country: "India", keywords: ["mumbai", "delhi"] },
  "Asia/Dubai": { city: "Dubai", country: "United Arab Emirates", keywords: [] },
  "Asia/Riyadh": { city: "Riyadh", country: "Saudi Arabia", keywords: [] },
  "Asia/Jerusalem": { city: "Jerusalem", country: "Israel", keywords: [] },
  "Australia/Sydney": { city: "Sydney", country: "Australia", keywords: [] },
  "Australia/Melbourne": { city: "Melbourne", country: "Australia", keywords: [] },
  "Australia/Brisbane": { city: "Brisbane", country: "Australia", keywords: [] },
  "Australia/Perth": { city: "Perth", country: "Australia", keywords: [] },
  "Pacific/Auckland": { city: "Auckland", country: "New Zealand", keywords: [] },
  "Pacific/Honolulu": { city: "Honolulu", country: "United States", keywords: ["usa", "hawaii"] },
  "Africa/Cairo": { city: "Cairo", country: "Egypt", keywords: [] },
  "Africa/Johannesburg": { city: "Johannesburg", country: "South Africa", keywords: [] },
  "Africa/Lagos": { city: "Lagos", country: "Nigeria", keywords: [] },
  "Africa/Nairobi": { city: "Nairobi", country: "Kenya", keywords: [] },
};

const regionNames: Record<string, string> = {
  Africa: "Africa",
  America: "Americas",
  Antarctica: "Antarctica",
  Arctic: "Arctic",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Australia",
  Europe: "Europe",
  Indian: "Indian Ocean",
  Pacific: "Pacific",
};

const cityNamesZh: Record<string, string> = {
  "America/New_York": "纽约",
  "America/Los_Angeles": "洛杉矶",
  "America/Chicago": "芝加哥",
  "America/Denver": "丹佛",
  "America/Toronto": "多伦多",
  "America/Vancouver": "温哥华",
  "America/Mexico_City": "墨西哥城",
  "America/Sao_Paulo": "圣保罗",
  "America/Argentina/Buenos_Aires": "布宜诺斯艾利斯",
  "Europe/London": "伦敦",
  "Europe/Paris": "巴黎",
  "Europe/Berlin": "柏林",
  "Europe/Madrid": "马德里",
  "Europe/Rome": "罗马",
  "Europe/Amsterdam": "阿姆斯特丹",
  "Europe/Zurich": "苏黎世",
  "Europe/Stockholm": "斯德哥尔摩",
  "Europe/Warsaw": "华沙",
  "Europe/Istanbul": "伊斯坦布尔",
  "Europe/Moscow": "莫斯科",
  "Asia/Tokyo": "东京",
  "Asia/Shanghai": "上海",
  "Asia/Hong_Kong": "香港",
  "Asia/Singapore": "新加坡",
  "Asia/Seoul": "首尔",
  "Asia/Taipei": "台北",
  "Asia/Bangkok": "曼谷",
  "Asia/Jakarta": "雅加达",
  "Asia/Manila": "马尼拉",
  "Asia/Kuala_Lumpur": "吉隆坡",
  "Asia/Kolkata": "加尔各答",
  "Asia/Dubai": "迪拜",
  "Asia/Riyadh": "利雅得",
  "Asia/Jerusalem": "耶路撒冷",
  "Australia/Sydney": "悉尼",
  "Australia/Melbourne": "墨尔本",
  "Australia/Brisbane": "布里斯班",
  "Australia/Perth": "珀斯",
  "Pacific/Auckland": "奥克兰",
  "Pacific/Honolulu": "檀香山",
  "Africa/Cairo": "开罗",
  "Africa/Johannesburg": "约翰内斯堡",
  "Africa/Lagos": "拉各斯",
  "Africa/Nairobi": "内罗毕",
};

function optionFor(id: string): TimezoneOption {
  const custom = featured[id];
  const parts = id.split("/");
  const city = custom?.city ?? parts.at(-1)?.replaceAll("_", " ") ?? id;
  const country = custom?.country ?? regionNames[parts[0] ?? ""] ?? "Other";
  const displayCity = locale === "zh" ? (cityNamesZh[id] ?? city) : city;
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: id,
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value;
  const utcOffset = offset === "GMT" ? "UTC+00:00" : offset?.replace(/^GMT/, "UTC");

  return {
    id,
    city,
    country,
    keywords: custom?.keywords ?? [],
    label: `${displayCity} — ${id} (${utcOffset ?? t("utcOffsetUnavailable")})`,
  };
}

const supportedIds = new Set<string>([
  "UTC",
  ...Object.keys(featured),
  ...Intl.supportedValuesOf("timeZone"),
]);

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  ...Array.from(supportedIds)
    .map(optionFor)
    .sort((left, right) => {
      const leftFeatured = Object.hasOwn(featured, left.id);
      const rightFeatured = Object.hasOwn(featured, right.id);
      if (leftFeatured !== rightFeatured) return leftFeatured ? -1 : 1;
      return left.label.localeCompare(right.label);
    }),
];

export function searchTimezoneOptions(query: string): TimezoneOption[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return TIMEZONE_OPTIONS;

  return TIMEZONE_OPTIONS.filter((option) =>
    [option.city, option.country, option.id, option.label, ...option.keywords].some((value) =>
      value.toLocaleLowerCase().includes(normalized),
    ),
  );
}
