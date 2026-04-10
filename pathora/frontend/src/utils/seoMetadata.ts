import type { Metadata } from "next";

import {
  SITE_NAME,
  SITE_URL,
  METADATA_BASE,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE_URL,
} from "@/configs/site";

// ─── Default Robots Config ──────────────────────────────────────────────────

export const DEFAULT_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const ADMIN_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

// ─── Canonical URL ───────────────────────────────────────────────────────────

/**
 * Build an absolute canonical URL for a given path.
 * Always use this instead of hardcoding URLs in metadata.
 */
export function buildCanonicalUrl(path: string): string {
  const cleanPath = `/${path.replace(/^\/|\/$/g, "")}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Returns the alternates.canonical field for Next.js Metadata.
 * Falls back to SITE_URL when path is empty/undefined.
 */
export function buildAlternates(path?: string): Metadata["alternates"] {
  return {
    canonical: buildCanonicalUrl(path ?? "/"),
  };
}

// ─── OG Image Builder ────────────────────────────────────────────────────────

export interface OgImageInput {
  /** Absolute URL (e.g. CDN, S3) */
  absoluteUrl?: string;
  /** Path relative to /public (e.g. "/images/og-tour.png") */
  publicPath?: string;
  /** Alt text for the image */
  alt: string;
}

/**
 * Resolves an OG image to an absolute URL.
 * - If absoluteUrl is provided, use it directly.
 * - If publicPath is provided, prepend SITE_URL.
 * - Falls back to DEFAULT_OG_IMAGE_URL.
 */
export function resolveOgImage(input?: OgImageInput) {
  if (!input) return undefined;

  const url =
    input.absoluteUrl ??
    (input.publicPath ? `${SITE_URL}${input.publicPath}` : undefined) ??
    `${SITE_URL}${DEFAULT_OG_IMAGE_URL}`;

  return [{ url, alt: input.alt, width: 1200, height: 630 }];
}

// ─── Generic Page Metadata ───────────────────────────────────────────────────

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: OgImageInput;
  type?: "website" | "article" | "book" | "profile" | "music" | "video" | "product";
  /** Additional article-specific fields (publishedTime, authors, tags, etc.) */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
    section?: string;
  };
}

/** Convenience wrapper for static page metadata. Use this in page.tsx files. */
export function buildPageMetadata(options: PageMetadataOptions) {
  const { title, description, path, keywords, ogImage, type = "website", article } = options;

  const ogImages = resolveOgImage(ogImage);
  const fallbackImage = `${SITE_URL}${DEFAULT_OG_IMAGE_URL}`;

  return {
    title,
    description,
    keywords: keywords ?? [SITE_NAME, "travel", "tours", "Vietnam", "Asia"],
    alternates: buildAlternates(path),
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: buildCanonicalUrl(path),
      images: ogImages,
      ...(article && { article }),
    },
    twitter: {
      card: "summary_large_image",
      site: `@${TWITTER_HANDLE}`,
      creator: `@${TWITTER_HANDLE}`,
      title,
      description,
      images: ogImage
        ? [
            ogImage.absoluteUrl ??
            (ogImage.publicPath ? `${SITE_URL}${ogImage.publicPath}` : fallbackImage),
          ]
        : [fallbackImage],
    },
    robots: DEFAULT_ROBOTS,
  };
}

// ─── Fallback Metadata (Not Found / Error) ───────────────────────────────────

export function buildNotFoundMetadata(title?: string): Metadata {
  return {
    title: title ?? "Page Not Found",
    description: "The page you are looking for does not exist.",
    robots: { index: false, follow: false },
  };
}

// ─── JSON-LD Helpers ─────────────────────────────────────────────────────────

export interface OrganizationJsonLd {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export function buildOrganizationJsonLd(options: OrganizationJsonLd = {}): string {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options.name ?? SITE_NAME,
    url: options.url ?? SITE_URL,
    ...(options.logo && {
      logo: {
        "@type": "ImageObject",
        url: options.logo.startsWith("http") ? options.logo : `${SITE_URL}${options.logo}`,
      },
    }),
    ...(options.sameAs && options.sameAs.length > 0 && {
      sameAs: options.sameAs,
    }),
  };
  return JSON.stringify(org);
}

export interface WebPageJsonLd {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  type?: string;
}

export function buildWebPageJsonLd(options: WebPageJsonLd = {}): string {
  const page = {
    "@context": "https://schema.org",
    "@type": options.type ?? "WebPage",
    url: options.url ?? SITE_URL,
    name: options.title,
    description: options.description,
    ...(options.image && {
      image: {
        "@type": "ImageObject",
        url: options.image.startsWith("http") ? options.image : `${SITE_URL}${options.image}`,
      },
    }),
    ...(options.author && {
      author: {
        "@type": "Organization",
        name: options.author,
      },
    }),
    ...(options.publishedTime && { datePublished: options.publishedTime }),
    ...(options.modifiedTime && { dateModified: options.modifiedTime }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
  return JSON.stringify(page);
}

// ─── Breadcrumb JSON-LD ──────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
  return JSON.stringify(breadcrumb);
}

// ─── Re-export metadataBase for convenience ───────────────────────────────────
export { METADATA_BASE, SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE_URL };
