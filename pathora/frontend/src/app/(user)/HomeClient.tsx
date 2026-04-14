"use client";

import React, { Suspense, useEffect, useState } from "react";
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

export default function HomeClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-black text-white min-h-screen overflow-x-hidden selection:bg-landing-accent/30 selection:text-white"
    >
      <Suspense fallback={<div className="h-20 bg-black" />}>
        <BoldNavbar />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="min-h-[100dvh]" />}>
        <BoldHeroSection />
      </Suspense>
      <BoldStatsStrip />
      <Suspense fallback={<SectionSkeleton className="h-96 mt-16" />}>
        <BoldTrendingDestinations />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-[800px] mt-16" />}>
        <BoldFeaturedTrips />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-72 mt-16" />}>
        <BoldLatestTours />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldWhyChooseUs />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldCtaSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-80 mt-16" />}>
        <BoldReviewsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-64 mt-16" />}>
        <BoldFooter />
      </Suspense>
    </main>
  );
}
