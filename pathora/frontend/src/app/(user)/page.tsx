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
  HeroSection,
  StatsSection,
  TrendingDestinationsSection,
  FeaturedTripsSection,
  LatestToursSection,
  WhyChooseSection,
  CTASection,
  ReviewsSection,
} from "@/features/home/components";
import { LandingHeader, LandingFooter } from "@/features/shared/components";

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
      className="bg-background min-h-screen overflow-x-hidden"
    >
      {/* Header */}
      <Suspense fallback={<div className="h-20 bg-white" />}>
        <LandingHeader />
      </Suspense>

      {/* Hero */}
      <Suspense fallback={<SectionSkeleton className="h-screen" />}>
        <HeroSection />
      </Suspense>

      {/* Stats */}
      <StatsSection />

      {/* Trending Destinations */}
      <Suspense fallback={<SectionSkeleton className="h-96 mt-16" />}>
        <TrendingDestinationsSection />
      </Suspense>

      {/* Featured Trips */}
      <Suspense fallback={<SectionSkeleton className="h-[800px] mt-16" />}>
        <FeaturedTripsSection />
      </Suspense>

      {/* Latest Tours */}
      <Suspense fallback={<SectionSkeleton className="h-72 mt-16" />}>
        <LatestToursSection />
      </Suspense>

      {/* Why Choose Us */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <WhyChooseSection />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <CTASection />
      </Suspense>

      {/* Reviews */}
      <Suspense fallback={<SectionSkeleton className="h-80 mt-16" />}>
        <ReviewsSection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <LandingFooter />
      </Suspense>
    </main>
  );
}
