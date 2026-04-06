import type { Metadata } from "next";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import ToursLoading from "./loading";

export const metadata: Metadata = {
  title: "Browse Tours | Pathora",
  description:
    "Discover our curated collection of tour packages across Vietnam and Asia. Filter by destination, duration, and travel style to find your perfect trip.",
  keywords: ["tours", "travel packages", "Vietnam tours", "Asia tours", "guided tours"],
  openGraph: {
    title: "Browse Tours | Pathora",
    description:
      "Discover our curated collection of tour packages across Vietnam and Asia. Filter by destination, duration, and travel style.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const TourDiscoveryPage = dynamic(
  () => import("@/features/tours/components").then((m) => m.TourDiscoveryPage),
  { loading: () => <ToursLoading /> },
);

export default function ToursPage() {
  return (
    <Suspense fallback={<ToursLoading />}>
      <TourDiscoveryPage />
    </Suspense>
  );
}
