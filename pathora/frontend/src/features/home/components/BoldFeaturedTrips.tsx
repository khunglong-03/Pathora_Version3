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
  isVisa: boolean;
  size: "large" | "medium" | "wide";
};

import { getFallbackImage } from "@/utils/imageFallback";

const mapFeaturedTours = (tours: FeaturedTour[]): FeaturedTile[] =>
  tours.map((tour, index) => ({
    id: tour.id,
    name: tour.tourName,
    duration: `${tour.durationDays} ${tour.durationDays > 1 ? "days" : "day"}`,
    price: `${tour.basePrice.toLocaleString()} VND`,
    rating: Number((tour.rating ?? 4.8).toFixed(1)),
    image: tour.thumbnail || getFallbackImage(index),
    isVisa: tour.isVisa,
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
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12">
        <div
          ref={titleRef}
          className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-1000 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span suppressHydrationWarning className="inline-block px-4 py-1.5 rounded-full bg-stone-100 text-[11px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-6 border border-stone-200/50 shadow-sm">
            {t("landing.featured.eyebrow") || "Handpicked"}
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]"
          >
            {t("landing.featured.title") || "Featured Adventures"}
          </h2>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchFeaturedTours}
              className="mt-4 inline-flex items-center rounded-xl bg-red-100 px-6 py-2.5 text-sm font-bold text-red-800 hover:bg-red-200 transition-colors"
            >
              {t("landing.featured.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={gridRef}
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] transition-all duration-1000 ${
              gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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
                  <div className="h-full min-h-[350px] rounded-[1.5rem] bg-stone-100" />
                </div>
              );
            })}
          </div>
        ) : featuredTours.length === 0 ? (
          <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-12 text-center text-stone-500 font-medium">
            {t("landing.featured.empty") || "No featured tours available at the moment."}
          </div>
        ) : (
          <div
            ref={gridRef}
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] transition-all duration-1000 ${
              gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
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
                    visaRequired={tour.isVisa}
                    visaLabel={t("landing.tourDetail.visaRequired", "Visa Required")}
                    price={tour.price}
                    href={`/tours/${tour.id}`}
                    height="h-full"
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
