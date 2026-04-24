"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { useCountUp } from "../hooks/useCountUp";
import { homeService } from "@/api/services/homeService";

interface StatDisplayItem {
  value: number;
  suffix: string;
  labelKey: string;
  isDecimal?: boolean;
  isLoading?: boolean;
}

function StatItem({
  stat,
  isVisible,
  t,
}: {
  stat: StatDisplayItem;
  isVisible: boolean;
  t: (key: string) => string;
}) {
  const countValue = useCountUp(
    { end: stat.value, duration: 2000, suffix: stat.suffix },
    isVisible
  );

  if (stat.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 md:px-8 animate-pulse">
        <div className="h-10 w-20 bg-stone-200 rounded mb-2" />
        <div className="h-4 w-24 bg-stone-100 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 md:px-8">
      <span
        className="text-4xl md:text-5xl font-black text-stone-900 mb-2 tracking-tighter"
      >
        {stat.isDecimal ? stat.value + stat.suffix : countValue}
      </span>
      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.2em]">
        {t(stat.labelKey)}
      </span>
    </div>
  );
}

const FALLBACK_STATS: StatDisplayItem[] = [
  { value: 0, suffix: "+", labelKey: "landing.stats.items.totalTours" },
  { value: 0, suffix: "+", labelKey: "landing.stats.items.totalTravellers" },
  { value: 0, suffix: " km", labelKey: "landing.stats.items.totalDistanceKm" },
  { value: 0, suffix: "/7", labelKey: "landing.stats.items.support" },
];

export const BoldStatsStrip = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });
  const [stats, setStats] = useState<StatDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statsToShow = stats.length > 0 ? stats : FALLBACK_STATS;
  const displayStats = statsToShow.map((s) => ({ ...s, isLoading }));

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    homeService
      .getHomeStats()
      .then((data) => {
        if (cancelled) return;
        setStats([
          { value: data.totalTours, suffix: "+", labelKey: "landing.stats.items.totalTours" },
          { value: data.totalTravelers, suffix: "+", labelKey: "landing.stats.items.totalTravellers" },
          { value: data.totalDistanceKm, suffix: "k", labelKey: "landing.stats.items.totalDistanceKm" },
          { value: 24, suffix: "/7", labelKey: "landing.stats.items.support" },
        ]);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative py-8 bg-stone-50 border-b border-stone-200">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12">
        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-stone-200/80 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {error && stats.length === 0 ? (
            <div className="col-span-4 flex items-center justify-center py-6 text-stone-400 text-sm font-medium">
              {t("landing.stats.unavailable") || "Statistics temporarily unavailable"}
            </div>
          ) : (
            displayStats.map((stat, idx) => (
              <StatItem key={idx} stat={stat} isVisible={isVisible} t={t} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};
