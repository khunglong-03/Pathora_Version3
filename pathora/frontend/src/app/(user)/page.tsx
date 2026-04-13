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

import {
  BoldHeroSection,
  BoldStatsStrip,
  BoldTrendingDestinations,
  BoldFeaturedTrips,
  BoldLatestTours,
  BoldWhyChooseUs,
  BoldCtaSection,
  BoldReviewsSection,
  BoldNavbar,
  BoldFooter
} from "@/features/home/components";

const SectionSkeleton = ({ className }: { className: string }) => {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto w-full max-w-7xl rounded-2xl bg-black/5 animate-pulse ${className}`}
    />
  );
};

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-black text-white min-h-screen overflow-x-hidden selection:bg-landing-accent/30 selection:text-white"
    >
      {/* Header */}
      <Suspense fallback={<div className="h-20 bg-black" />}>
        <BoldNavbar />
      </Suspense>

      {/* Hero */}
      <Suspense fallback={<SectionSkeleton className="min-h-[100dvh]" />}>
        <BoldHeroSection />
      </Suspense>

      {/* Stats */}
      <BoldStatsStrip />

      {/* Trending Destinations */}
      <Suspense fallback={<SectionSkeleton className="h-96 mt-16" />}>
        <BoldTrendingDestinations />
      </Suspense>

      {/* Featured Trips */}
      <Suspense fallback={<SectionSkeleton className="h-[800px] mt-16" />}>
        <BoldFeaturedTrips />
      </Suspense>

      {/* Latest Tours */}
      <Suspense fallback={<SectionSkeleton className="h-72 mt-16" />}>
        <BoldLatestTours />
      </Suspense>

      {/* Why Choose Us */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldWhyChooseUs />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldCtaSection />
      </Suspense>

      {/* Reviews */}
      <Suspense fallback={<SectionSkeleton className="h-80 mt-16" />}>
        <BoldReviewsSection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldFooter />
      </Suspense>
    </main>
  );
}
