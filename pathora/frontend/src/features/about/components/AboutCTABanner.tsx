"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Icon } from "@/components/ui";

const CTABanner = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#05073c] py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#fa8b02] mb-3">
          {t("landing.aboutUs.readyToExplore")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white leading-10">
          {t("landing.aboutUs.ctaTitle")} <br />
          {t("landing.aboutUs.ctaTitleWith")}{" "}
          <span className="text-[#fa8b02]">Pathora</span>
        </h2>
        <p className="mt-4 text-sm leading-5 text-white/60 max-w-107 mx-auto">
          {t("landing.aboutUs.ctaDescription")}
        </p>
        <Link
          href="/tours"
          className="mt-8 inline-flex items-center gap-2 bg-[#fa8b02] text-white font-semibold text-base px-8 py-4 rounded-[14px] shadow-[0_10px_15px_rgba(126,42,12,0.3),0_4px_6px_rgba(126,42,12,0.3)] hover:brightness-110 transition-all"
        >
          {t("landing.aboutUs.browsePackageTours")}
          <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export { CTABanner };
