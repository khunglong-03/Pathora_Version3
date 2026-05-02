"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { homeService } from "@/api/services/homeService";
import { FeaturedTour } from "@/types/home";
import { cn } from "@/lib/cn";
import {
  SectionContainer,
  ScrollReveal,
  EyebrowTag,
  StarRating,
} from "@/features/shared/components/shared";

const FeaturedTripsSection = () => {
  const { t } = useTranslation();
  const [tours, setTours] = useState<FeaturedTour[]>([]);

  useEffect(() => {
    homeService
      .getFeaturedTours(8)
      .then((data) => {
        if (data) setTours(data);
      })
      .catch(() => {});
  }, []);

  if (!tours.length) return null;

  return (
    <section className={cn("py-24 md:py-32 bg-gray-50/50 dark:bg-[#0d0d1a]")}>
      <SectionContainer>
        {/* Header */}
        <ScrollReveal className={cn("v-stack md:h-stack md:items-end md:justify-between gap-4 mb-14 md:mb-16")}>
          <div>
            <EyebrowTag>Featured</EyebrowTag>
            <h2 className={cn("mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight")}>
              {t("landing.featured.title")}
            </h2>
          </div>
          <Link
            href="/tours"
            className={cn("group inline-flex items-center gap-2 text-sm font-semibold text-[#fa8b02] hover:text-[#e67a00] transition-colors")}
          >
            {t("landing.latestTours.seeAll")}
            <span className={cn("w-7 h-7 rounded-full bg-[#fa8b02]/10 center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:bg-[#fa8b02]/20")}>
              <svg className={cn("w-3.5 h-3.5")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </ScrollReveal>

        {/* Tour Grid */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6")}>
          {tours.slice(0, 8).map((tour, idx) => (
            <ScrollReveal key={tour.id} delay={idx * 60}>
              <Link href={`/tours/${tour.id}`} className={cn("block h-full")}>
                {/* Double-Bezel card */}
                <div className={cn("group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/40 dark:border-white/8 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1.5 h-full")}>
                  <div className={cn("rounded-[calc(1.25rem-0.25rem)] bg-white dark:bg-[#1a1a2e] overflow-hidden h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]")}>
                    {/* Image */}
                    <div className={cn("relative h-48 md:h-52 overflow-hidden")}>
                      {tour.thumbnail ? (
                        <Image
                          src={tour.thumbnail}
                          alt={tour.tourName}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className={cn("object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105")}
                        />
                      ) : (
                        <div className={cn("absolute inset-0 bg-gradient-to-br from-amber-200/60 via-orange-200/40 to-rose-200/30")} />
                      )}
                      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/30 to-transparent")} />

                      {/* Price badge */}
                      <div className={cn("absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-[#fa8b02] shadow-sm")}>
                        ${tour.basePrice.toLocaleString()}
                      </div>

                      {/* Classification badge */}
                      {tour.classificationName && (
                        <div className={cn("absolute top-3 left-3 bg-[#fa8b02]/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-semibold text-white uppercase tracking-wider")}>
                          {tour.classificationName}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("p-4 md:p-5")}>
                      {/* Rating */}
                      {tour.rating && tour.rating > 0 && (
                        <div className={cn("mb-2")}>
                          <StarRating count={Math.round(tour.rating)} size="sm" />
                        </div>
                      )}

                      <h3 className={cn("font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2 font-['Outfit',_system-ui] leading-snug")}>
                        {tour.tourName}
                      </h3>

                      <div className={cn("mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400")}>
                        {tour.location && (
                          <div className={cn("flex items-center gap-1.5 truncate")}>
                            <svg className={cn("w-3.5 h-3.5 shrink-0 text-[#fa8b02]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                            <span className={cn("truncate")}>{tour.location}</span>
                          </div>
                        )}
                        <div className={cn("flex items-center gap-1.5 shrink-0")}>
                          <svg className={cn("w-3.5 h-3.5 text-gray-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span>{tour.durationDays}d</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default FeaturedTripsSection;
