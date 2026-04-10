/**
 * Site-wide URL configuration for SEO, OpenGraph, and canonical URLs.
 *
 * Usage:
 *   import { SITE_URL } from "@/configs/site"
 *   <link rel="canonical" href={`${SITE_URL}/tours/${id}`} />
 */

const normalizeUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/+$/, "") : undefined;
};

// Primary site URL used for:
// - metadataBase (required for absolute OG image URLs)
// - canonical links
// - JSON-LD @id fields
export const SITE_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  (process.env.NODE_ENV === "production"
    ? undefined // Must be set in production — throws if used without value
    : "http://localhost:3001");

// Ensure metadataBase is always a valid absolute URL string
export const METADATA_BASE =
  process.env.NODE_ENV === "production"
    ? normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://pathora.vivugo.me"
    : "http://localhost:3001";

// Site name shown in OpenGraph and JSON-LD
export const SITE_NAME = "Pathora";

// Twitter handle (without @)
export const TWITTER_HANDLE = "pathora";

// Default site logo URL for OG images (fallback when no specific image provided)
export const DEFAULT_OG_IMAGE_URL = "/og-default.png";
