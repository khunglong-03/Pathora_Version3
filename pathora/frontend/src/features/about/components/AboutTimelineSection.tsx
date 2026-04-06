"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { MILESTONES, MilestoneItem } from "./AboutUsPageData";

const TimelineSection = ({ milestones = MILESTONES }: { milestones?: MilestoneItem[] }) => {
  const { t } = useTranslation();
  return (
    <section className="py-16">
      <div className="max-w-[48rem] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#fa8b02] mb-2">
            {t("landing.aboutUs.ourJourney")}
          </p>
          <h2 className="text-4xl font-bold text-[#05073c]">
            {t("landing.aboutUs.journeyTitle")}
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-linear-to-b from-[#fa8b02] via-[#ffd6a8] to-transparent" />

          <div className="flex flex-col gap-8">
            {milestones.map((m) => (
              <div key={m.year} className="relative pl-[60px]">
                {/* Dot */}
                <div className="absolute left-0 top-1 w-9 h-9 rounded-full border-[1.6px] border-[#fa8b02] bg-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#fa8b02]" />
                </div>
                {/* Content */}
                <p className="text-xs font-bold text-[#fa8b02] mb-1">
                  {m.year}
                </p>
                <h3 className="text-base font-bold text-[#05073c] leading-6 mb-1">
                  {t(`landing.aboutUs.timeline.${m.titleKey}`)}
                </h3>
                <p className="text-sm leading-[1.421875rem] text-[#6a7282]">
                  {t(`landing.aboutUs.timeline.${m.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { TimelineSection };
