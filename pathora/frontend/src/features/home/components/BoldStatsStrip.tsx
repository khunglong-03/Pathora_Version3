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
      <div className="flex flex-col items-center justify-center py-4 md:px-8 animate-pulse">
        <div className="h-9 w-16 bg-white/10 rounded mb-1" />
        <div className="h-4 w-20 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 md:px-8">
      <span
        className="text-3xl md:text-4xl font-bold text-white mb-1"
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      >
        {stat.isDecimal ? stat.value + stat.suffix : countValue}
      </span>
      <span className="text-sm text-white/40 uppercase tracking-wider">
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
          { value: data.totalDistanceKm, suffix: " km", labelKey: "landing.stats.items.totalDistanceKm" },
          { value: 24, suffix: "/7", labelKey: "landing.stats.items.support" },
        ]);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
        // On error, show fallback — do not crash the page
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative py-6 bg-[#0a0a1a] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {error && stats.length === 0 ? (
            <div className="col-span-4 flex items-center justify-center py-4 text-white/30 text-sm">
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
