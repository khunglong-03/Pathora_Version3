"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { HERO_BG } from "./AboutUsPageData";

const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <section className="relative h-[500px] -mt-20 overflow-hidden">
      <Image
        src={HERO_BG}
        alt=""
        width={1474}
        height={640}
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#05073c]/70 via-[#05073c]/40 to-[#05073c]/80" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pt-10">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[1.2px] text-[#fa8b02] bg-[#fa8b02]/20 border border-[#fa8b02]/40 mb-4">
          {t("landing.aboutUs.ourStory")}
        </span>
        <h1 className="text-4xl md:text-[60px] font-bold leading-tight text-white">
          {t("landing.aboutUs.weAre")}{" "}
          <span className="text-[#fa8b02]">Pathora</span>
        </h1>
        <p className="mt-4 max-w-[35.1875rem] text-base leading-[1.625rem] text-white/70">
          {t("landing.aboutUs.heroSubtitle")}
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm">
          <a
            href="/home"
            className="text-white/50 hover:text-white/80 transition-colors">
            {t("landing.nav.home")}
          </a>
          <Icon
            icon="heroicons-outline:chevron-right"
            className="w-3.5 h-3.5 text-white/50"
          />
          <span className="text-white/80">{t("landing.nav.aboutUs")}</span>
        </div>
      </div>
    </section>
  );
};

export { HeroBanner };
