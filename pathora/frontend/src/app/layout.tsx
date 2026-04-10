import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/providers/AppProviders";
import DisableDarkReader from "@/components/ui/DisableDarkReader";
import { METADATA_BASE, SITE_NAME, SITE_URL } from "@/configs/site";
import { buildOrganizationJsonLd, buildWebPageJsonLd } from "@/utils/seoMetadata";
import SEOHead from "@/components/seo/SEOHead";

const SITE_DESCRIPTION =
  "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services across Vietnam and Asia.";

const ORGANIZATION_JSON_LD = buildOrganizationJsonLd({
  name: SITE_NAME,
  url: SITE_URL,
  sameAs: [
    "https://facebook.com/pathora",
    "https://twitter.com/pathora",
    "https://instagram.com/pathora",
    "https://youtube.com/pathora",
  ],
});

const WEB_PAGE_JSON_LD = buildWebPageJsonLd({
  url: SITE_URL,
  title: `${SITE_NAME} - Discover Amazing Tours`,
  description: SITE_DESCRIPTION,
});

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: {
    template: "%s | Pathora",
    default: "Pathora - Discover Amazing Tours",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "travel",
    "tours",
    "Vietnam travel",
    "Asia tours",
    "custom tour",
    "visa service",
    "booking",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Pathora - Discover Amazing Tours",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@pathora",
    title: "Pathora - Discover Amazing Tours",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/globe.svg", type: "image/svg+xml" },
      { url: "/file.svg", type: "image/svg+xml" },
    ],
    shortcut: "/globe.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-darkreader-disable="true" data-theme="light">
      <body
        suppressHydrationWarning
        className="light antialiased"
        data-darkreader-disable="true"
      >
        <SEOHead jsonLd={[ORGANIZATION_JSON_LD, WEB_PAGE_JSON_LD]} />
        <DisableDarkReader />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
