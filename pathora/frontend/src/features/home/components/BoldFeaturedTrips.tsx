"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { BoldTiltCard } from "./BoldTiltCard";
import { homeService } from "@/api/services/homeService";
import type { FeaturedTour } from "@/types/home";

type FeaturedTile = {
  id: string;
  name: string;
  duration: string;
  price: string;
  rating: number;
  image: string;
  size: "large" | "medium" | "wide";
};

const fallbackImage =
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80";

const mapFeaturedTours = (tours: FeaturedTour[]): FeaturedTile[] =>
  tours.map((tour, index) => ({
    id: tour.id,
    name: tour.tourName,
    duration: `${tour.durationDays} ${tour.durationDays > 1 ? "days" : "day"}`,
    price: `$${tour.basePrice.toLocaleString()}`,
    rating: Number((tour.rating ?? 4.8).toFixed(1)),
    image: tour.thumbnail || fallbackImage,
    size: index === 0 ? "large" : index === 3 ? "wide" : "medium",
  }));

export const BoldFeaturedTrips = () => {
  const { t, i18n } = useTranslation();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();
  const [gridRef, gridVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.05 });
  const [featuredTours, setFeaturedTours] = useState<FeaturedTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedTours = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await homeService.getFeaturedTours(
        8,
        i18n.resolvedLanguage ?? i18n.language
      );
      setFeaturedTours(mapFeaturedTours(data ?? []));
    } catch {
      setError(t("landing.featured.loadError") || "Unable to load featured tours");
      setFeaturedTours([]);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);

  React.useEffect(() => {
    fetchFeaturedTours();
  }, [fetchFeaturedTours]);

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div
          ref={titleRef}
          className={`text-center mb-14 transition-all duration-700 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-sm font-medium text-[#ec4899] uppercase tracking-widest">
            {t("landing.featured.eyebrow") || "Handpicked"}
          </span>
          <h2
            className="mt-3 text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.featured.title") || "Featured Adventures"}
          </h2>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchFeaturedTours}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-medium text-red-100 hover:bg-red-500/20 transition-colors"
            >
              {t("landing.featured.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={gridRef}
            className={`grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[300px] transition-all duration-1000 ${
              gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {Array.from({ length: 4 }).map((_, idx) => {
              const sizeClass =
                idx === 0
                  ? "md:col-span-2 row-span-2"
                  : idx === 3
                    ? "md:col-span-2"
                    : "";
              return (
                <div key={idx} className={`${sizeClass} animate-pulse`}>
                  <div className="h-full min-h-[300px] rounded-2xl bg-white/10" />
                </div>
              );
            })}
          </div>
        ) : featuredTours.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            {t("landing.featured.empty") || "No featured tours available at the moment."}
          </div>
        ) : (
          <div
            ref={gridRef}
            className={`grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[300px] transition-all duration-1000 ${
              gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {featuredTours.map((tour) => {
              const sizeClass =
                tour.size === "large"
                  ? "md:col-span-2 row-span-2"
                  : tour.size === "wide"
                    ? "md:col-span-2"
                    : "";

              return (
                <div key={tour.id} className={sizeClass}>
                  <BoldTiltCard
                    image={tour.image}
                    title={tour.name}
                    subtitle={tour.duration}
                    badge={`${tour.rating}★`}
                    price={tour.price}
                    href="/tours"
                    height={tour.size === "large" ? "h-full" : "h-[300px]"}
                    width="w-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
