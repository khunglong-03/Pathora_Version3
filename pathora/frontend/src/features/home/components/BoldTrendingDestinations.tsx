"use client";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { BoldTiltCard } from "./BoldTiltCard";
import { homeService } from "@/api/services/homeService";
import type { NormalizedTourInstanceVm } from "@/types/tour";

type DestinationCard = {
  id: string;
  name: string;
  country: string;
  image: string;
  tours: number;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1509030969356-4dd11f51c5e8?w=600&q=80";

const mapInstancesToDestinations = (
  data: NormalizedTourInstanceVm[]
): DestinationCard[] =>
  data.map((instance) => ({
    id: instance.id,
    name: instance.location || instance.tourName || "Unknown Destination",
    country: "Vietnam",
    image:
      instance.thumbnail?.publicURL ||
      instance.images?.[0]?.publicURL ||
      fallbackImage,
    tours: 1,
  }));

export const BoldTrendingDestinations = () => {
  const { t, i18n } = useTranslation();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [destinations, setDestinations] = useState<DestinationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await homeService.getAvailablePublicInstances(
        undefined,
        1,
        6,
        i18n.resolvedLanguage ?? i18n.language
      );
      setDestinations(mapInstancesToDestinations(result?.data ?? []));
    } catch {
      setError(
        t("landing.destinations.loadError") || "Unable to load destinations"
      );
      setDestinations([]);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);

  React.useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div
          ref={titleRef}
          className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <span className="text-sm font-medium text-[#fb8b02] uppercase tracking-widest mb-3 block">
              {t("landing.destinations.eyebrow") || "Explore"}
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {t("landing.destinations.title") || "Trending Destinations"}
            </h2>
          </div>
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group"
          >
            {t("landing.destinations.viewAll") || "View all destinations"}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchDestinations}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-medium text-red-100 hover:bg-red-500/20 transition-colors"
            >
              {t("landing.destinations.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="snap-center shrink-0 animate-pulse">
                <div className="w-[260px] h-[260px] rounded-2xl bg-white/10" />
              </div>
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            {t("landing.destinations.empty") ||
              "No destinations available at the moment."}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {destinations.map((dest, idx) => (
              <div
                key={dest.id}
                className="snap-center shrink-0"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <BoldTiltCard
                  image={dest.image}
                  title={dest.name}
                  subtitle={dest.country}
                  badge={`${dest.tours} ${t("landing.destinations.tours") || "tour"}`}
                  href="/tours"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
