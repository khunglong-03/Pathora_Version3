"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { homeService } from "@/api/services/homeService";
import { TrendingDestination, TopAttraction } from "@/types/home";
import {
  SectionContainer,
  ScrollReveal,
  EyebrowTag,
} from "@/features/shared/components/shared";

/* ── Warm gradient placeholders for destinations ─────────── */
const DEST_GRADIENTS = [
  "from-amber-400/80 via-orange-300/60 to-rose-300/40",
  "from-teal-400/70 via-cyan-300/50 to-blue-300/40",
  "from-violet-400/70 via-purple-300/50 to-pink-300/40",
  "from-emerald-400/70 via-green-300/50 to-lime-300/40",
  "from-rose-400/70 via-pink-300/50 to-fuchsia-300/40",
  "from-sky-400/70 via-blue-300/50 to-indigo-300/40",
];

const DestinationsSection = () => {
  const { t } = useTranslation();
  const [destinations, setDestinations] = useState<TrendingDestination[]>([]);
  const [attractions, setAttractions] = useState<TopAttraction[]>([]);

  useEffect(() => {
    homeService
      .getTrendingDestinations(6)
      .then((data) => {
        if (data) setDestinations(data);
      })
      .catch(() => {});

    homeService
      .getTopAttractions(4)
      .then((data) => {
        if (data) setAttractions(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 md:py-32">
      <SectionContainer>
        {/* Section header */}
        <ScrollReveal className="text-center mb-14 md:mb-20">
          <EyebrowTag>Destinations</EyebrowTag>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight">
            {t("landing.destinations.trendingTitle")}
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm md:text-base">
            {t("landing.stats.description")}
          </p>
        </ScrollReveal>

        {/* Bento grid — asymmetric */}
        {destinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
            {destinations.slice(0, 6).map((dest, idx) => {
              // First card: wide (8 cols, 2 rows), others: normal (4 cols)
              const isLarge = idx === 0;
              const colSpan = isLarge ? "md:col-span-8 md:row-span-2" : "md:col-span-4";

              return (
                <ScrollReveal
                  key={`${dest.city}-${idx}`}
                  className={colSpan}
                  delay={idx * 80}
                >
                  {/* Double-Bezel card */}
                  <div className="group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 h-full">
                    <div
                      className={`relative rounded-[calc(1.25rem-0.25rem)] overflow-hidden h-full ${
                        isLarge ? "min-h-[280px] md:min-h-full" : "min-h-[200px] md:min-h-[220px]"
                      }`}
                    >
                      {/* Image or gradient placeholder */}
                      {dest.imageUrl ? (
                        <Image
                          src={dest.imageUrl}
                          alt={`${dest.city}, ${dest.country}`}
                          fill
                          sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${DEST_GRADIENTS[idx % DEST_GRADIENTS.length]}`}
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <h3
                          className={`font-bold text-white font-['Outfit',_system-ui] tracking-tight ${
                            isLarge ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
                          }`}
                        >
                          {dest.city}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-white/70 text-sm">{dest.country}</span>
                          <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium">
                            {t("landing.destinations.tours", { count: dest.toursCount })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* Top Attractions */}
        {attractions.length > 0 && (
          <>
            <ScrollReveal className="text-center mt-24 md:mt-32 mb-14">
              <EyebrowTag>Attractions</EyebrowTag>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight">
                {t("landing.destinations.topAttractionsTitle")}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {attractions.map((attr, idx) => (
                <ScrollReveal key={`${attr.name}-${idx}`} delay={idx * 100}>
                  <div className="group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1">
                    <div className="relative rounded-[calc(1.25rem-0.25rem)] overflow-hidden min-h-[240px]">
                      {attr.imageUrl ? (
                        <Image
                          src={attr.imageUrl}
                          alt={attr.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${DEST_GRADIENTS[(idx + 3) % DEST_GRADIENTS.length]}`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="font-bold text-white text-base font-['Outfit',_system-ui]">
                          {attr.name}
                        </h3>
                        <p className="text-white/60 text-xs mt-1">
                          {attr.city}, {attr.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </>
        )}
      </SectionContainer>
    </section>
  );
};

export default DestinationsSection;
