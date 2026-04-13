"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Button } from "@/components/ui";
import Image from "next/image";
import { homeService } from "@/api/services/homeService";
import type { LatestTour } from "@/types/home";

const formatBadgeDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "NEW";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const imageFallback = "";

export const BoldLatestTours = () => {
  const { t, i18n } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const [latestTours, setLatestTours] = useState<LatestTour[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestTours = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await homeService.getLatestTours(6, i18n.resolvedLanguage ?? i18n.language);
      setLatestTours(data ?? []);
    } catch {
      setError(t("landing.latest.loadError") || "Unable to load latest tours");
      setLatestTours([]);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);

  React.useEffect(() => {
    fetchLatestTours();
  }, [fetchLatestTours]);

  return (
    <section className="py-20 md:py-28 bg-[#050510]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div
          className={`flex items-end justify-between mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <span suppressHydrationWarning className="text-sm font-medium text-[#3b82f6] uppercase tracking-widest">
              {t("landing.latest.eyebrow") || "Just Added"}
            </span>
            <h2
              className="mt-3 text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {t("landing.latest.title") || "Latest Tours"}
            </h2>
          </div>
          <Button
            link="/tours"
            text={t("landing.latest.viewAll") || "View all"}
            icon="heroicons-outline:arrow-right"
            iconPosition="right"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all text-sm"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchLatestTours}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/30 px-4 py-2 text-xs font-medium text-red-100 hover:bg-red-500/20 transition-colors"
            >
              {t("landing.latest.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={ref}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="snap-center shrink-0 w-64 animate-pulse">
                <div className="h-40 rounded-xl mb-3 bg-white/10" />
                <div className="h-4 w-40 bg-white/10 rounded mb-2" />
                <div className="h-3 w-24 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (latestTours?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            {t("landing.latest.empty") || "No latest tours available yet."}
          </div>
        ) : (
          <div
            ref={ref}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {latestTours!.map((tour) => (
              <Link
                key={tour.id}
                href="/tours"
                className="snap-center shrink-0 w-64 group"
              >
                <div className="relative h-40 rounded-xl overflow-hidden mb-3 bg-[#111827]">
                  <Image
                    src={tour.thumbnail || imageFallback}
                    alt={tour.tourName}
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#fb8b02]/90 text-white text-xs font-semibold">
                    {formatBadgeDate(tour.createdAt)}
                  </div>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-[#fb8b02] transition-colors line-clamp-2">
                  {tour.tourName}
                </h3>
                <p className="text-white/40 text-xs flex items-center gap-1">
                  {t("landing.latest.viewDetails") || "View details"}{" "}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
