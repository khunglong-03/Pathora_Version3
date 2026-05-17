"use client";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { homeService } from "@/api/services/homeService";
import type { SearchTour } from "@/types/home";
import { getFallbackImage } from "@/utils/imageFallback";
import { cn } from "@/lib/cn";

const continentKeys: Record<number, string> = {
  1: "asia",
  2: "europe",
  3: "africa",
  4: "americas",
  5: "oceania",
};

const getValidImageUrl = (thumbnail: any, fallbackIndex: string | number) => {
  if (!thumbnail || thumbnail === "undefined") return getFallbackImage(fallbackIndex);
  if (typeof thumbnail === "string") return thumbnail;
  if (typeof thumbnail === "object" && thumbnail.publicURL) return thumbnail.publicURL;
  return getFallbackImage(fallbackIndex);
};

export const BoldTrendingDestinations = () => {
  const { t, i18n } = useTranslation();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [continents, setContinents] = useState<number[]>([]);
  const [activeContinent, setActiveContinent] = useState<number | null>(null);
  const [tours, setTours] = useState<SearchTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    homeService.getContinents()
      .then(data => {
        if (data && data.length > 0) {
          setContinents(data);
          setActiveContinent(data[0]);
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const fetchToursByContinent = React.useCallback(async (continent: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await homeService.searchTours({
        continent: continent,
        pageSize: 6,
        language: i18n.resolvedLanguage ?? i18n.language
      });
      setTours(data?.data ?? []);
    } catch {
      setError(t("landing.continents.error") || "Unable to load tours");
      setTours([]);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);

  React.useEffect(() => {
    if (activeContinent !== null) {
      fetchToursByContinent(activeContinent);
    }
  }, [activeContinent, fetchToursByContinent]);

  const getContinentLabel = (continent: number): string => {
    const key = continentKeys[continent];
    if (key) {
      return t(`landing.continents.${key}`) || key;
    }
    return `Continent ${continent}`;
  };

  return (
    <section className={cn("py-24 md:py-32 bg-stone-50 overflow-hidden")}>
      <div className={cn("max-w-[90rem] mx-auto px-6 md:px-12")}>
        <div
          ref={titleRef}
          className={`v-stack md:h-stack md:items-end justify-between gap-6 mb-12 transition-all duration-1000 ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className={cn("max-w-2xl")}>
            <span suppressHydrationWarning className={cn("inline-block px-4 py-1.5 rounded-full bg-stone-200/50 text-[11px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-4 border border-stone-200/50 shadow-sm")}>
              {t("landing.continents.eyebrow", "EXPLORE BY CONTINENT")}
            </span>
            <h2
              className={cn("text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]")}
            >
              {t("landing.continents.title", "Where do you want to go?")}
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {continents.map((continent) => (
            <button
              key={continent}
              onClick={() => setActiveContinent(continent)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                activeContinent === continent
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
              )}
            >
              {getContinentLabel(continent)}
            </button>
          ))}
        </div>

        {error ? (
          <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto")}>
            <p className={cn("text-red-800 font-medium")}>{error}</p>
          </div>
        ) : isLoading ? (
          <div
            ref={scrollRef}
            className={cn("flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={cn("snap-center shrink-0 w-[280px] md:w-[320px] animate-pulse")}>
                <div className={cn("h-[200px] md:h-[240px] rounded-[1.5rem] mb-4 bg-stone-200")} />
                <div className={cn("h-5 w-3/4 bg-stone-200 rounded mb-3")} />
                <div className={cn("h-4 w-1/2 bg-stone-200 rounded")} />
              </div>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className={cn("rounded-[2rem] border border-stone-200 bg-white p-12 text-center text-stone-500 font-medium")}>
            {t("landing.continents.empty", "No tours available for this continent at the moment.")}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={cn("flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:-mx-12 md:px-12")}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tours.map((tour, idx) => (
              <Link
                key={`${tour.id}-${idx}`}
                href={`/tours/${tour.id}`}
                className={cn("snap-center shrink-0 w-[280px] md:w-[320px] group transition-all duration-1000")}
                style={{
                  animationDelay: `${idx * 100}ms`,
                  opacity: titleVisible ? 1 : 0,
                  transform: titleVisible ? 'translateY(0)' : 'translateY(2rem)'
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
                  
                  {tour.isVisa && (
                    <div className={cn("absolute top-4 left-4 rounded-full bg-orange-50/95 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 shadow-sm border border-orange-200/50")}>
                      Visa Required
                    </div>
                  )}
                  
                  {tour.location && (
                    <div className={cn("absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-wider shadow-sm")}>
                      {tour.location}
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
