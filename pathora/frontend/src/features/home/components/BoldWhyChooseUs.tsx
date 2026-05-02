"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { Trophy, CompassIcon, ChatCircleIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const features = [
  {
    Icon: Trophy,
    titleKey: "landing.whyChoose.items.price.title",
    descKey: "landing.whyChoose.items.price.desc",
    color: "text-amber-600",
    bg: "bg-amber-100/50",
  },
  {
    Icon: CompassIcon,
    titleKey: "landing.whyChoose.items.guides.title",
    descKey: "landing.whyChoose.items.guides.desc",
    color: "text-blue-600",
    bg: "bg-blue-100/50",
  },
  {
    Icon: ChatCircleIcon,
    titleKey: "landing.whyChoose.items.support.title",
    descKey: "landing.whyChoose.items.support.desc",
    color: "text-emerald-600",
    bg: "bg-emerald-100/50",
  },
  {
    Icon: ArrowsClockwiseIcon,
    titleKey: "landing.whyChoose.items.flexible.title",
    descKey: "landing.whyChoose.items.flexible.desc",
    color: "text-orange-600",
    bg: "bg-orange-100/50",
  },
];

export const BoldWhyChooseUs = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className={cn("py-24 md:py-32 bg-stone-50")}>
      <div className={cn("max-w-[90rem] mx-auto px-6 md:px-12")}>
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span suppressHydrationWarning className={cn("inline-block px-4 py-1.5 rounded-full bg-stone-200/50 text-[11px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-6 border border-stone-200/50 shadow-sm")}>
            {t("landing.whyChoose.eyebrow")}
          </span>
          <h2
            className={cn("text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]")}
          >
            {t("landing.whyChoose.title")}
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div
          ref={ref}
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={cn("p-8 rounded-[1.5rem] bg-white border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 group v-stack items-center text-center")}
              style={{
                transitionDelay: isVisible ? `${idx * 100}ms` : "0ms",
              }}
            >
              <div
                className={`w-16 h-16 rounded-[1rem] mx-auto mb-6 center transition-transform duration-500 group-hover:scale-110 ${feature.bg}`}
              >
                <feature.Icon size={32} weight="fill" className={feature.color} />
              </div>
              <h3 className={cn("text-stone-900 font-bold text-[17px] mb-3 leading-snug")}>
                {t(feature.titleKey)}
              </h3>
              <p className={cn("text-stone-500 text-[14px] leading-relaxed font-medium")}>
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
