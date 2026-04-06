"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { WHO_WE_ARE_IMG } from "./AboutUsPageData";

const WhoWeAreSection = () => {
  const { t } = useTranslation();
  return (
    <section className="max-w-[72rem] mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row gap-14 items-center">
        {/* Left: Image */}
        <div className="relative w-full lg:w-[536px] flex-shrink-0">
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <Image
              src={WHO_WE_ARE_IMG}
              alt={t("landing.aboutUs.whoWeAre")}
              width={536}
              height={320}
              className="w-full h-[320px] object-cover"
            />
            <div className="absolute inset-0 rounded-3xl bg-linear-to-t from-[#05073c]/50 to-transparent" />
          </div>
          {/* Experience badge */}
          <div className="absolute bottom-[-20px] right-5 bg-[#fa8b02] rounded-2xl shadow-xl px-6 py-4 text-white">
            <p className="text-2xl font-bold leading-8">15+</p>
            <p className="text-xs font-medium opacity-90">
              {t("landing.aboutUs.yearsExperience")}
            </p>
          </div>
        </div>

        {/* Right: Text */}
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#fa8b02] mb-2">
            {t("landing.aboutUs.whoWeAre")}
          </p>
          <h2 className="text-4xl font-bold leading-[2.8125rem] text-[#05073c]">
            {t("landing.aboutUs.passionateTravelers")} <br />
            <span className="text-[#fa8b02]">
              {t("landing.aboutUs.expertGuides")}
            </span>
          </h2>
          <p className="mt-5 text-sm leading-[1.421875rem] text-[#6a7282]">
            {t("landing.aboutUs.whoWeAreDesc1")}
          </p>
          <p className="mt-4 text-sm leading-[1.421875rem] text-[#6a7282]">
            {t("landing.aboutUs.whoWeAreDesc2")}
          </p>
          <Link
            href="/tours"
            className="mt-8 inline-flex items-center gap-2 bg-[#fa8b02] text-white font-semibold text-sm px-7 py-3.5 rounded-[14px] shadow-[0_4px_6px_#ffd6a8,0_2px_4px_#ffd6a8] hover:brightness-110 transition-all">
            {t("landing.aboutUs.exploreOurTours")}
            <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export { WhoWeAreSection };
