"use client";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { BoldTiltCard } from "./BoldTiltCard";
import { homeService } from "@/api/services/homeService";
import type { TrendingDestination } from "@/types/home";
import { getFallbackImage } from "@/utils/imageFallback";
import { cn } from "@/lib/cn";

type DestinationCard = {
  id: string;
  name: string;
  country: string;
  image: string;
  tours: number;
};

const mapTrendingToDestinations = (data: TrendingDestination[]): DestinationCard[] =>
  data.map((dest, idx) => ({
    id: `${dest.city}-${dest.country}`,
    name: dest.city,
    country: dest.country,
    image: dest.imageUrl || getFallbackImage(idx),
    tours: dest.toursCount,
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
      const result = await homeService.getTrendingDestinations(8);
      setDestinations(mapTrendingToDestinations(result ?? []));
    } catch {
      setError(
        t("landing.destinations.loadError") || "Unable to load destinations"
      );
      setDestinations([]);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, t]);

  React.useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  return (
    <section className={cn("py-24 md:py-32 bg-stone-50 overflow-hidden")}>
      <div className={cn("max-w-[90rem] mx-auto px-6 md:px-12")}>
        <div
          ref={titleRef}
          className={`v-stack md:h-stack md:items-end justify-between gap-6 mb-16 transition-all duration-1000 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className={cn("max-w-2xl")}>
            <span suppressHydrationWarning className={cn("inline-block px-4 py-1.5 rounded-full bg-stone-200/50 text-[11px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-4 border border-stone-200/50 shadow-sm")}>
              {t("landing.destinations.eyebrow") || "Explore"}
            </span>
            <h2
              className={cn("text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]")}
            >
              {t("landing.destinations.title") || "Trending Destinations"}
            </h2>
          </div>
          <Link
            href="/tours"
            className={cn("inline-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 hover:bg-stone-100 hover:border-stone-300 transition-all font-bold text-sm shadow-sm hover:shadow-md active:scale-95 group shrink-0")}
          >
            {t("landing.destinations.viewAll") || "View all destinations"}
            <ArrowRight size={16} weight="bold" className={cn("group-hover:translate-x-1 transition-transform")} />
          </Link>
        </div>

        {error ? (
          <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto")}>
            <p className={cn("text-red-800 font-medium")}>{error}</p>
            <button
              type="button"
              onClick={fetchDestinations}
              className={cn("mt-4 inline-flex items-center rounded-xl bg-red-100 px-6 py-2.5 text-sm font-bold text-red-800 hover:bg-red-200 transition-colors")}
            >
              {t("landing.destinations.retry") || "Retry"}
            </button>
          </div>
        ) : isLoading ? (
          <div
            ref={scrollRef}
            className={cn("flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={cn("snap-center shrink-0 animate-pulse")}>
                <div className={cn("w-[280px] h-[360px] md:w-[320px] md:h-[420px] rounded-[1.5rem] bg-stone-200/50")} />
              </div>
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className={cn("rounded-[2rem] border border-stone-200 bg-white p-12 text-center text-stone-500 font-medium")}>
            {t("landing.destinations.empty") ||
              "No destinations available at the moment."}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={cn("flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {destinations.map((dest, idx) => (
              <div
                key={dest.id}
                className={cn("snap-center shrink-0 transition-all duration-1000")}
                style={{
                  animationDelay: `${idx * 100}ms`,
                  opacity: titleVisible ? 1 : 0,
                  transform: titleVisible ? 'translateY(0)' : 'translateY(2rem)'
                }}
              >
                <BoldTiltCard
                  image={dest.image}
                  title={dest.name}
                  subtitle={dest.country}
                  badge={`${dest.tours} ${dest.tours === 1 ? "tour" : t("landing.destinations.tours") || "tours"}`}
                  href={`/tours?destination=${encodeURIComponent(dest.name)}`}
                  height="h-[360px] md:h-[420px]"
                  width="w-[280px] md:w-[320px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
