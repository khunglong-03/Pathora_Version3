"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import {
  SectionContainer,
  ScrollReveal,
  EyebrowTag,
} from "@/features/shared/components/shared";

/* ── Feature icons ─────────────────────────────────────────── */
const featureIcons = [
  // Shield check — Trusted & Safe
  <svg key="shield" className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
  // Tag — Best Price
  <svg key="tag" className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>,
  // Globe — Global Coverage
  <svg key="globe" className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>,
  // Sparkles — Curated
  <svg key="sparkles" className={cn("w-6 h-6")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.09 3.36L16.36 6l-3.27 1.09L12 10.36l-1.09-3.27L7.64 6l3.27-1.09L12 2zM5 15l.66 2.03L7.69 18l-2.03.66L5 20.69l-.66-2.03L2.31 18l2.03-.66L5 15zM19 12l.66 2.03L21.69 15l-2.03.66L19 17.69l-.66-2.03L16.31 15l2.03-.66L19 12z" />
  </svg>,
];

const featureColors = [
  "bg-emerald-500/10 text-emerald-500",
  "bg-amber-500/10 text-amber-500",
  "bg-blue-500/10 text-blue-500",
  "bg-purple-500/10 text-purple-500",
];

/* ── Why Choose Section ────────────────────────────────────── */
export const WhyChooseSection = () => {
  const { t } = useTranslation();
  const features = t("landing.whyChoose.features", { returnObjects: true }) as
    | Array<{ title: string; desc: string }>
    | string;
  const featureList = Array.isArray(features)
    ? features
    : [
        { title: "Trusted & Safe", desc: "Every tour is verified and insured for your peace of mind" },
        { title: "Best Price Guarantee", desc: "Competitive pricing with no hidden fees" },
        { title: "Global Coverage", desc: "Tours across 50+ countries with local expert guides" },
        { title: "Curated Experiences", desc: "Hand-picked itineraries designed by travel professionals" },
      ];

  return (
    <section className={cn("py-24 md:py-32 bg-gray-50/50 dark:bg-[#0d0d1a]")}>
      <SectionContainer>
        <ScrollReveal className={cn("text-center mb-14 md:mb-20")}>
          <EyebrowTag>Why Us</EyebrowTag>
          <h2 className={cn("mt-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui] tracking-tight")}>
            {t("landing.whyChoose.title")}
          </h2>
          <p className={cn("mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm md:text-base")}>
            {t("landing.whyChoose.subtitle")}
          </p>
        </ScrollReveal>

        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6")}>
          {featureList.map((feature, idx) => (
            <ScrollReveal key={idx} delay={idx * 100}>
              {/* Double-Bezel card */}
              <div className={cn("group rounded-[1.25rem] bg-gray-100/50 dark:bg-white/5 border border-gray-200/40 dark:border-white/8 p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 h-full")}>
                <div className={cn("rounded-[calc(1.25rem-0.25rem)] bg-white dark:bg-[#1a1a2e] p-6 md:p-8 h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]")}>
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl center ${featureColors[idx % featureColors.length]} transition-all duration-500 group-hover:scale-110`}
                  >
                    {featureIcons[idx % featureIcons.length]}
                  </div>

                  <h3 className={cn("mt-5 text-base md:text-lg font-bold text-gray-900 dark:text-white font-['Outfit',_system-ui]")}>
                    {feature.title}
                  </h3>
                  <p className={cn("mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed")}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

/* ── CTA Section ───────────────────────────────────────────── */
export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className={cn("py-24 md:py-32")}>
      <SectionContainer>
        <ScrollReveal>
          {/* Full-bleed CTA — Double-Bezel */}
          <div className={cn("rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-r from-[#fa8b02]/10 to-[#e67a00]/5 border border-[#fa8b02]/10 p-1.5 md:p-2")}>
            <div className={cn("relative rounded-[calc(1.5rem-0.375rem)] md:rounded-[calc(2.5rem-0.5rem)] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden px-8 md:px-16 py-16 md:py-24")}>
              {/* Radial glow */}
              <div className={cn("absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#fa8b02]/10 blur-[100px]")} />
              <div className={cn("absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#e67a00]/5 blur-[80px]")} />

              {/* Content */}
              <div className={cn("relative z-10 text-center max-w-2xl mx-auto")}>
                <h2
                  className={cn("text-3xl md:text-5xl font-bold text-white font-['Outfit',_system-ui] tracking-tight leading-tight")}
                >
                  {t("landing.cta.title")}
                </h2>
                <p className={cn("mt-5 text-white/60 text-sm md:text-base max-w-xl mx-auto")}>
                  {t("landing.cta.description")}
                </p>

                {/* CTA Button — pill with trailing icon */}
                <Link
                  href="/tours"
                  className={cn("mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fa8b02] to-[#e67a00] hover:from-[#e67a00] hover:to-[#d06e00] text-white font-semibold text-sm px-7 py-3.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-[#fa8b02]/30 active:scale-[0.97] group")}
                >
                  {t("landing.cta.exploreNow")}
                  <span className={cn("w-7 h-7 rounded-full bg-white/15 center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:bg-white/25")}>
                    <svg className={cn("w-3.5 h-3.5")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </SectionContainer>
    </section>
  );
};
