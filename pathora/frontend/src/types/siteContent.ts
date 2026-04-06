// ── Site Content Admin Types ─────────────────────────────────

export interface SiteContentAdminListItem {
  id: string;
  pageKey: string;
  contentKey: string;
  isLocalized: boolean;
  hasEnglish: boolean;
  hasVietnamese: boolean;
  lastModifiedOnUtc: string | null;
  lastModifiedBy: string | null;
  createdOnUtc: string;
  createdBy: string | null;
}

export interface SiteContentAdminDetailItem extends SiteContentAdminListItem {
  englishContentValue: string;
  vietnameseContentValue: string;
}

export interface UpdateAdminSiteContentRequest {
  englishContentValue: string;
  vietnameseContentValue: string;
}

// ── Policy Page Types ───────────────────────────────────────

/** Shape of a policy section returned by GET /api/site-content?pageKey=policies */
export interface PolicySection {
  id?: string;
  icon: string;
  title: string;
  items: string[];
}

/** A plain string (used when backend has already resolved locale). */
export type PlainText = string;

/** A record mapping locale codes to strings (used when backend returns localized content). */
export type LocalizedText = Record<string, string>;

/** A record mapping locale codes to string arrays. */
export type LocalizedStringArray = Record<string, string[]>;

/**
 * Raw section shape from API — may be either:
 * Case A (locale-resolved):  title: string, items: string[]
 * Case B (localized):        title: LocalizedText, items: LocalizedStringArray
 */
export interface RawPolicySection {
  id?: string;
  icon: string;
  title: PlainText | LocalizedText;
  items: string[] | LocalizedStringArray;
}

/** Type guard for Case A — backend has already resolved locale. */
export const isPlainTextPolicySection = (item: unknown): item is PolicySection => {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    "icon" in obj && typeof obj.icon === "string" &&
    "title" in obj && typeof obj.title === "string" &&
    "items" in obj && Array.isArray(obj.items) &&
    (obj.items as unknown[]).every((i) => typeof i === "string")
  );
};

/** Type guard for Case B — backend returns localized object.
 *  Passes if title and items are objects AND at least one of en/vi is present.
 */
export const isLocalizedPolicySection = (item: unknown): item is RawPolicySection => {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  if (!("icon" in obj) || typeof obj.icon !== "string") return false;
  if (!("title" in obj) || typeof obj.title !== "object" || obj.title === null) return false;
  if (!("items" in obj) || typeof obj.items !== "object" || obj.items === null) return false;

  const titleObj = obj.title as Record<string, unknown>;
  const itemsObj = obj.items as Record<string, unknown>;

  const hasEnTitle = "en" in titleObj && typeof titleObj.en === "string";
  const hasViTitle = "vi" in titleObj && typeof titleObj.vi === "string";
  if (!hasEnTitle && !hasViTitle) return false;

  const hasEnItems = Array.isArray(itemsObj.en) && (itemsObj.en as unknown[]).every((i) => typeof i === "string");
  const hasViItems = Array.isArray(itemsObj.vi) && (itemsObj.vi as unknown[]).every((i) => typeof i === "string");
  if (!hasEnItems && !hasViItems) return false;

  return true;
};
