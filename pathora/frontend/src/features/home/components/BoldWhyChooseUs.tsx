"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const features = [
  {
    icon: "🏆",
    titleKey: "landing.whyChoose.items.price.title",
    descKey: "landing.whyChoose.items.price.desc",
    color: "#fb8b02",
  },
  {
    icon: "🧭",
    titleKey: "landing.whyChoose.items.guides.title",
    descKey: "landing.whyChoose.items.guides.desc",
    color: "#3b82f6",
  },
  {
    icon: "💬",
    titleKey: "landing.whyChoose.items.support.title",
    descKey: "landing.whyChoose.items.support.desc",
    color: "#ec4899",
  },
  {
    icon: "🔄",
    titleKey: "landing.whyChoose.items.flexible.title",
    descKey: "landing.whyChoose.items.flexible.desc",
    color: "#fb8b02",
  },
];

export const BoldWhyChooseUs = () => {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
            {t("landing.whyChoose.eyebrow") || "Why Pathora"}
          </span>
          <h2
            className="mt-3 text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            {t("landing.whyChoose.title") || "Why Choose Us"}
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div
          ref={ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#111827]/50 border border-white/5 hover:border-white/10 hover:bg-[#111827]/80 transition-all duration-300 group text-center"
            >
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
              >
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-white/40 text-xs leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
