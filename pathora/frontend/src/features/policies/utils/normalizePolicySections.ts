import i18n from "@/i18n/config";
import {
  type PolicySection,
  type RawPolicySection,
  isPlainTextPolicySection,
  isLocalizedPolicySection,
} from "@/types/siteContent";

const LOCALE_FALLBACK_ORDER = ["vi", "en"] as const;

export function getResolvedLocale(): string {
  // SSR-safe: prefer localStorage (persisted by i18n) on client,
  // fall back to i18n.resolvedLanguage which defaults to "en" on server.
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("i18nextLng");
    if (stored) {
      return stored.toLowerCase().split("-")[0];
    }
  }
  const resolved = i18n.resolvedLanguage || i18n.language;
  return resolved?.split("-")[0]?.toLowerCase() ?? "en";
}

export function pickLocalizedText(
  localized: Record<string, unknown>,
  locale: string
): string {
  if (typeof localized[locale] === "string") {
    return localized[locale] as string;
  }
  for (const candidate of LOCALE_FALLBACK_ORDER) {
    if (typeof localized[candidate] === "string") {
      return localized[candidate] as string;
    }
  }
  return "";
}

export function pickLocalizedArray(
  localized: Record<string, unknown>,
  locale: string
): string[] {
  if (Array.isArray(localized[locale])) {
    return (localized[locale] as unknown[]).filter(
      (item): item is string => typeof item === "string"
    );
  }
  for (const candidate of LOCALE_FALLBACK_ORDER) {
    if (Array.isArray(localized[candidate])) {
      return (localized[candidate] as unknown[]).filter(
        (item): item is string => typeof item === "string"
      );
    }
  }
  return [];
}

export function resolveLocalizedSection(
  raw: RawPolicySection,
  locale: string
): PolicySection {
  const titleObj = raw.title as Record<string, unknown>;
  const itemsObj = raw.items as Record<string, unknown>;

  return {
    id: raw.id,
    icon: raw.icon,
    title: pickLocalizedText(titleObj, locale),
    items: pickLocalizedArray(itemsObj, locale),
  };
}

export interface NormalizedPoliciesResult {
  sections: PolicySection[];
  raw: unknown;
}

export function normalizePolicySections(
  raw: unknown,
  locale?: string
): NormalizedPoliciesResult {
  if (!Array.isArray(raw)) {
    return { sections: [], raw };
  }

  const targetLocale = locale ?? getResolvedLocale();
  const sections: PolicySection[] = [];

  for (const item of raw) {
    if (isPlainTextPolicySection(item)) {
      // Case A
      sections.push({
        id: item.id,
        icon: item.icon,
        title: item.title,
        items: item.items,
      });
    } else if (isLocalizedPolicySection(item)) {
      // Case B
      sections.push(resolveLocalizedSection(item, targetLocale));
    }
    // else: skip malformed items silently
  }

  return { sections, raw };
}
