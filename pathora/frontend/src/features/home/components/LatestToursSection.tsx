"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { homeService } from "@/api/services/homeService";
import { LatestTour } from "@/types/home";
import {
  SectionContainer,
  ScrollReveal,
  EyebrowTag,
} from "@/features/shared/components/shared";

const LatestToursSection = () => {
  const { t, i18n } = useTranslation();
  const [tours, setTours] = useState<LatestTour[]>([]);
  const locale = i18n.resolvedLanguage || i18n.language || "en";

  useEffect(() => {
    homeService
      .getLatestTours(6)
      .then((data) => {
        if (data) setTours(data);
      })
      .catch(() => {});
  }, []);

  if (!tours.length) return null;

  return (
    <section className="py-24 md:py-32">
      <SectionContainer>
        {/* Header */}
        <ScrollReveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14 md:mb-16">
          <div>
            <EyebrowTag>New Arrivals</EyebrowTag>
            <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight">
              {t("landing.latestTours.title")}
            </h2>
          </div>
          <Link
            href="/tours"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#fa8b02] hover:text-[#e67a00] transition-colors"
          >
            {t("landing.latestTours.seeAll")}
            <span className="w-7 h-7 rounded-full bg-[#fa8b02]/10 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:bg-[#fa8b02]/20">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </ScrollReveal>

        {/* Horizontal snap-scroll cards */}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {tours.map((tour, idx) => (
            <ScrollReveal
              key={tour.id}
              delay={idx * 80}
              className="snap-start shrink-0 w-[300px] md:w-[340px]"
            >
              <Link href={`/tours/${tour.id}`} className="block h-full">
                <div className="group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/40 dark:border-white/8 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 h-full">
                  <div className="rounded-[calc(1.25rem-0.25rem)] bg-white dark:bg-[#1a1a2e] overflow-hidden h-full">
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden">
                      {tour.thumbnail ? (
                        <Image
                          src={tour.thumbnail}
                          alt={tour.tourName}
                          fill
                          sizes="340px"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-200/60 via-cyan-200/40 to-blue-200/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                      {/* NEW badge */}
                      <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                        New
                      </div>
                      {tour.isVisa && (
                        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#fa8b02] shadow-sm backdrop-blur-sm">
                          {t("landing.tourDetail.visaRequired", "Cần Visa")}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2 font-['Outfit',_system-ui] leading-snug">
                        {tour.tourName}
                      </h3>
                      {tour.shortDescription && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {tour.shortDescription}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span>
                          {new Date(tour.createdAt).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
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

export default LatestToursSection;
