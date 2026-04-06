import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Discover Amazing Tours | Pathora",
  description:
    "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations with Pathora.",
  keywords: ["tours", "Vietnam travel", "Asia tours", "travel packages", "guided tours"],
  openGraph: {
    title: "Discover Amazing Tours | Pathora",
    description:
      "Explore curated tour packages across Vietnam and Asia. Book guided tours, custom itineraries, and discover trending destinations.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// All Bold components — no lazy loading needed for this redesign
import {
  BoldHeroSection,
  BoldStatsStrip,
  BoldTrendingDestinations,
  BoldVideoShowcase,
  BoldFeaturedTrips,
  BoldLatestTours,
  BoldWhyChooseUs,
  BoldCtaSection,
  BoldReviewsSection,
  BoldFooter,
} from "@/features/home/components";

const SectionSkeleton = ({ className }: { className: string }) => {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto w-full max-w-7xl rounded-2xl bg-white/5 animate-pulse ${className}`}
    />
  );
};

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bold-theme min-h-screen overflow-x-hidden"
    >
      {/* Hero */}
      <BoldHeroSection />

      {/* Stats Strip */}
      <BoldStatsStrip />

      {/* Trending Destinations */}
      <Suspense fallback={<SectionSkeleton className="h-96" />}>
        <BoldTrendingDestinations />
      </Suspense>

      {/* Video Showcase */}
      <Suspense fallback={<SectionSkeleton className="h-[500px]" />}>
        <BoldVideoShowcase />
      </Suspense>

      {/* Featured Trips (Bento Grid) */}
      <Suspense fallback={<SectionSkeleton className="h-[800px]" />}>
        <BoldFeaturedTrips />
      </Suspense>

      {/* Latest Tours */}
      <Suspense fallback={<SectionSkeleton className="h-72" />}>
        <BoldLatestTours />
      </Suspense>

      {/* Why Choose Us */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldWhyChooseUs />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldCtaSection />
      </Suspense>

      {/* Reviews */}
      <Suspense fallback={<SectionSkeleton className="h-80" />}>
        <BoldReviewsSection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <BoldFooter />
      </Suspense>
    </main>
  );
}
