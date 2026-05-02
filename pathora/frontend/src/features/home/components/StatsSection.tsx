"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { homeService } from "@/api/services/homeService";
import { HomeStats } from "@/types/home";
import { cn } from "@/lib/cn";
import {
  SectionContainer,
  ScrollReveal,
  AnimatedCounter,
} from "@/features/shared/components/shared";

const FALLBACK: HomeStats = {
  totalTravelers: 12500,
  totalTours: 350,
  totalDistanceKm: 840000,
};

const StatsSection = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<HomeStats>(FALLBACK);

  useEffect(() => {
    homeService
      .getHomeStats()
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const statItems = [
    {
      value: stats.totalTravelers,
      label: t("landing.stats.items.totalTravellers"),
      suffix: "+",
      icon: (
        <svg className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      value: stats.totalTours,
      label: t("landing.stats.items.totalTours"),
      suffix: "+",
      icon: (
        <svg className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      value: stats.totalDistanceKm,
      label: t("landing.stats.items.milesCovered"),
      suffix: " km",
      icon: (
        <svg className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className={cn("relative -mt-20 z-20 pb-16 md:pb-24")}>
      <SectionContainer>
        <ScrollReveal>
          {/* Floating stats strip — Double-Bezel architecture */}
          <div className={cn("rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.04] dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 p-1.5 md:p-2 shadow-2xl shadow-black/5 backdrop-blur-sm")}>
            <div className={cn("rounded-[calc(1.5rem-0.375rem)] md:rounded-[calc(2rem-0.5rem)] bg-white dark:bg-[#1a1a2e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-white/10")}>
              {statItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn("flex items-center gap-4 md:gap-5 px-6 md:px-8 py-6 md:py-8 group")}
                >
                  {/* Icon container */}
                  <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#fa8b02]/10 center text-[#fa8b02] shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#fa8b02] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#fa8b02]/20")}>
                    {item.icon}
                  </div>

                  <div>
                    <div className={cn("text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight")}>
                      <AnimatedCounter
                        end={item.value}
                        suffix={item.suffix}
                        duration={2500}
                      />
                    </div>
                    <p className={cn("text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium")}>
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
};

export default StatsSection;
