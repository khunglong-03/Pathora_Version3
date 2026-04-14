import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Discover Amazing Tours | Pathora",
  description:
    "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations with Pathora.",
  keywords: ["tours", "Vietnam travel", "Asia tours", "travel packages", "guided tours"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Discover Amazing Tours | Pathora",
    description:
      "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

import HomeClient from "./HomeClient";

export default function Home() {
  return <HomeClient />;
}
