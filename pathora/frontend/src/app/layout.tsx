import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: {
    template: "%s | Pathora",
    default: "Pathora - Discover Amazing Tours",
  },
  description:
    "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services across Vietnam and Asia.",
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
    siteName: "Pathora",
    title: "Pathora - Discover Amazing Tours",
    description:
      "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@pathora",
    title: "Pathora - Discover Amazing Tours",
    description:
      "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services.",
  },
  robots: {
    index: true,
    follow: true,
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
      <head>
        {/* Disable DarkReader before any content loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Set attribute immediately
                document.documentElement.setAttribute('data-darkreader-disable', 'true');

                // Also try to disable via DarkReader API if available
                if (typeof window !== 'undefined') {
                  window.addEventListener('DOMContentLoaded', function() {
                    if (window.darkreader) {
                      window.darkreader.disable();
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="light antialiased"
        data-darkreader-disable="true"
      >
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
