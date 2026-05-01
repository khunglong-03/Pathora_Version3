"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { homeService } from "@/api/services/homeService";
import type { LatestTour } from "@/types/home";
import { getFallbackImage } from "@/utils/imageFallback";
import { cn } from "@/lib/cn";

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

const getValidImageUrl = (thumbnail: any, fallbackIndex: string | number) => {
  if (!thumbnail || thumbnail === "undefined") return getFallbackImage(fallbackIndex);
  if (typeof thumbnail === "string") return thumbnail;
  if (typeof thumbnail === "object" && thumbnail.publicURL) return thumbnail.publicURL;
  return getFallbackImage(fallbackIndex);
};

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
      const data = await homeService.getLatestTours(8, i18n.resolvedLanguage ?? i18n.language);
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
    <section className={cn("py-24 md:py-32 bg-white overflow-hidden border-t border-stone-100")}>
      <div className={cn("max-w-[90rem] mx-auto px-6 md:px-12")}>
        {/* Header */}
        <div
          className={`v-stack md:h-stack md:items-end justify-between gap-6 mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className={cn("max-w-2xl")}>
            <span suppressHydrationWarning className={cn("inline-block px-4 py-1.5 rounded-full bg-stone-100 text-[11px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-4 border border-stone-200/50 shadow-sm")}>
              {t("landing.latest.eyebrow") || "Just Added"}
            </span>
            <h2
              className={cn("text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]")}
            >
              {t("landing.latest.title") || "Latest Tours"}
            </h2>
          </div>
          <Link
            href="/tours"
            className={cn("inline-center gap-2 px-6 py-3 bg-stone-900 border border-stone-900 rounded-xl text-white hover:bg-stone-800 transition-all font-bold text-sm shadow-sm hover:shadow-md active:scale-95 group shrink-0")}
          >
            {t("landing.latest.viewAll") || "View all tours"}
            <ArrowRight size={16} weight="bold" className={cn("group-hover:translate-x-1 transition-transform")} />
          </Link>
        </div>

        {error ? (
          <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto")}>
            <p className={cn("text-red-800 font-medium")}>{error}</p>
            <button
              type="button"
              onClick={fetchLatestTours}
              className={cn("mt-4 inline-flex items-center rounded-xl bg-red-100 px-6 py-2.5 text-sm font-bold text-red-800 hover:bg-red-200 transition-colors")}
            >
              {t("landing.latest.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={ref}
            className={cn("flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={cn("snap-center shrink-0 w-[280px] md:w-[320px] animate-pulse")}>
                <div className={cn("h-[200px] md:h-[240px] rounded-[1.5rem] mb-4 bg-stone-100")} />
                <div className={cn("h-5 w-3/4 bg-stone-100 rounded mb-3")} />
                <div className={cn("h-4 w-1/2 bg-stone-100 rounded")} />
              </div>
            ))}
          </div>
        ) : (latestTours?.length ?? 0) === 0 ? (
          <div className={cn("rounded-[2rem] border border-stone-200 bg-stone-50 p-12 text-center text-stone-500 font-medium")}>
            {t("landing.latest.empty") || "No latest tours available yet."}
          </div>
        ) : (
          <div
            ref={ref}
            className={cn("flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {latestTours!.map((tour, idx) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className={cn("snap-center shrink-0 w-[280px] md:w-[320px] group transition-all duration-1000")}
                style={{
                  animationDelay: `${idx * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(2rem)'
                }}
              >
                <div className={cn("relative h-[200px] md:h-[240px] rounded-[1.5rem] overflow-hidden mb-5 bg-stone-100 shadow-sm border border-stone-200/50")}>
                  <Image
                    src={getValidImageUrl(tour.thumbnail, tour.id)}
                    alt={tour.tourName}
                    fill
                    sizes="(max-width: 768px) 280px, 320px"
                    className={cn("object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105")}
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-t from-stone-900/60 via-stone-900/10 to-transparent transition-opacity duration-500 group-hover:opacity-80")} />
                  
                  <div className={cn("absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-wider shadow-sm")}>
                    {formatBadgeDate(tour.createdAt)}
                  </div>
                  
                  {tour.isVisa && (
                    <div className={cn("absolute top-4 left-4 rounded-full bg-orange-50/95 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 shadow-sm border border-orange-200/50")}>
                      {t("landing.tourDetail.visaRequired", "Visa Required")}
                    </div>
                  )}
                </div>
                
                <h3 className={cn("text-stone-900 font-bold text-[17px] mb-2 leading-snug group-hover:text-stone-600 transition-colors line-clamp-2")}>
                  {tour.tourName}
                </h3>
                
                <p className={cn("text-stone-500 text-[13px] font-bold uppercase tracking-wider flex items-center gap-1.5")}>
                  {t("landing.latest.viewDetails") || "Explore Tour"}
                  <ArrowRight size={14} weight="bold" className={cn("group-hover:translate-x-1 transition-transform")} />
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
