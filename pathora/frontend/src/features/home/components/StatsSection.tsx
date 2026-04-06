"use client";
import React, { useEffect, useState } from "react";
import Image from "@/features/shared/components/LandingImage";
import { Button } from "@/components/ui";
import { SectionContainer } from "@/features/shared/components/shared";
import { useTranslation } from "react-i18next";
import { homeService } from "@/api/services/homeService";
import { HomeStats } from "@/types/home";

const PEOPLE_ICON = "/globe.svg";
const EXPLORE_IMG = "/explore-bg.png";
const BG_IMG = "/stats-bg.png";

const FALLBACK_STATS = {
  totalTravelers: 240,
  totalTours: 3672,
  totalDistanceKm: 92842,
};

export const StatsSection = () => {
  const { t, i18n } = useTranslation();
  const languageKey = i18n.resolvedLanguage || i18n.language;
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await homeService.getHomeStats();
        if (data) {
          setStats(data as HomeStats);
        }
      } catch {
        // Use fallback data on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [languageKey]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  const statsData = [
    {
      icon: PEOPLE_ICON,
      value: formatNumber(stats.totalTravelers),
      labelKey: "landing.stats.items.totalTravellers",
      color: "text-landing-accent",
    },
    {
      icon: PEOPLE_ICON,
      value: formatNumber(stats.totalTours),
      labelKey: "landing.stats.items.totalTours",
      color: "text-landing-heading",
    },
    {
      icon: PEOPLE_ICON,
      value: formatNumber(stats.totalDistanceKm),
      labelKey: "landing.stats.items.milesCovered",
      color: "text-landing-heading",
    },
  ];

  if (loading) {
    return (
      <section className="w-full bg-white py-8 md:py-16">
        <SectionContainer>
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full">
              <div className="h-12 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="h-6 w-full bg-gray-200 animate-pulse rounded" />
              <div className="flex flex-row md:flex-col gap-4 md:gap-5">
                {[1, 2, 3].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                    <div>
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative h-50 md:h-100 w-full lg:block">
              <div className="absolute right-0 top-0 w-[60%] md:w-75 h-[90%] md:h-95 rounded-xl md:rounded-2xl bg-gray-200 animate-pulse" />
              <div className="absolute left-0 bottom-0 w-[50%] md:w-65 h-[80%] md:h-80 rounded-xl md:rounded-2xl bg-gray-200 animate-pulse" />
            </div>
          </div>
        </SectionContainer>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-8 md:py-16">
      <SectionContainer>
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full">
            <h2 suppressHydrationWarning className="text-2xl md:text-[38px] font-bold text-landing-heading leading-tight">
              {t("landing.stats.titleLine1")}
              <br />
              {t("landing.stats.titleLine2")}
            </h2>
            <p suppressHydrationWarning className="text-landing-body text-sm md:text-base leading-relaxed max-w-md">
              {t("landing.stats.description")}
            </p>

            <div className="flex flex-row md:flex-col gap-4 md:gap-5 overflow-x-auto pb-2 md:pb-0">
              {statsData.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 bg-white shadow-sm md:shadow-none rounded-lg p-3 md:p-0 min-w-25 md:min-w-0 shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0">
                    <Image
                      src={stat.icon}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      className="w-5 h-5 md:w-7 md:h-7"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <span
                      className={`text-lg md:text-[28px] font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                    <p suppressHydrationWarning className="text-landing-body text-[10px] md:text-sm whitespace-nowrap md:whitespace-normal">
                      {t(stat.labelKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              link="/tours"
              text={t("landing.hero.exploreTours")}
              icon="heroicons-outline:chevron-right"
              iconPosition="right"
              iconClass="text-[12px] md:text-[16px]"
              className="inline-flex items-center justify-center gap-2 bg-landing-accent text-white font-semibold px-6 py-2.5 md:px-8 md:py-3 rounded-full hover:bg-landing-accent-hover transition-colors w-fit text-sm md:text-base mt-2 md:mt-0"
              suppressHydrationWarning
            />
          </div>

          <div className="flex-1 relative h-50 md:h-100 w-full lg:block">
            <div className="absolute right-0 top-0 w-[60%] md:w-75 h-[90%] md:h-95 rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={EXPLORE_IMG}
                alt={t("landing.stats.exploreImageAlt")}
                fill
                sizes="(max-width: 768px) 60vw, 300px"
                className="object-cover"
              />
            </div>
            <div className="absolute left-0 bottom-0 w-[50%] md:w-65 h-[80%] md:h-80 rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={BG_IMG}
                alt={t("landing.stats.backgroundImageAlt")}
                fill
                sizes="(max-width: 768px) 50vw, 260px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
};
