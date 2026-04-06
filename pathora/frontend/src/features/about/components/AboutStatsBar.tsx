"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { STATS } from "./AboutUsPageData";

const StatsBar = ({ stats = STATS }: { stats?: typeof STATS }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#05073c] px-6 md:px-22 py-10">
      <div className="max-w-[72rem] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.labelKey}
            className="flex flex-col items-center gap-1 text-center">
            <Icon icon={stat.icon} className="w-5 h-5 text-white" />
            <p className="text-[30px] font-bold leading-9 text-white">
              {stat.value}
            </p>
            <p className="text-xs text-white/50">
              {t(`landing.aboutUs.stats.${stat.labelKey}`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export { StatsBar };
