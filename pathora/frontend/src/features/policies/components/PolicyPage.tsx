"use client";
import Button from "@/components/ui/Button";
import React from "react";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { useTranslation } from "react-i18next";
import { useSiteContent } from "@/hooks/useSiteContent";
import type { PolicySection } from "@/types/siteContent";
import { normalizePolicySections } from "../utils/normalizePolicySections";

// ── Image Assets ────────────────────────────────────────────
const HERO_BG =
  "https://www.figma.com/api/mcp/asset/31a73fdb-dc1a-4937-9980-024dcb89ba42";
/* ═══════════════════════════════════════════════════════════ */
/*  Hero Banner                                                */
/* ═══════════════════════════════════════════════════════════ */
const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <section className="relative h-[500px] -mt-20 overflow-hidden">
      {/* Background */}
      <Image
        src={HERO_BG}
        alt=""
        width={1474}
        height={640}
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-[#05073c]/70 via-[#05073c]/40 to-[#05073c]/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pt-10">
        {/* Badge */}
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[1.2px] text-[#fa8b02] bg-[#fa8b02]/20 border border-[#fa8b02]/40 mb-4">
          {t("landing.policies.transparencyFirst")}
        </span>

        {/* Heading */}
        <h1 className="text-5xl md:text-[60px] font-bold leading-tight text-white">
          {t("landing.policies.our")}{" "}
          <span className="text-[#fa8b02]">{t("landing.policies.policy")}</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-[32.4375rem] text-base leading-[1.625rem] text-white/70">
          {t("landing.policies.heroSubtitle")}
        </p>

        {/* Breadcrumb */}
        <div className="mt-6 flex items-center gap-2 text-sm">
          <Link
            href="/home"
            className="text-white/50 hover:text-white/80 transition-colors">
            {t("landing.nav.home")}
          </Link>
          <Icon
            icon="heroicons-outline:chevron-right"
            className="w-3.5 h-3.5 text-white/50"
          />
          <span className="text-white/80">{t("landing.nav.ourPolicies")}</span>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Last Updated Notice Bar                                    */
/* ═══════════════════════════════════════════════════════════ */
const LastUpdatedBar = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#fff7ed] border-b border-[#ffedd4]">
      <div className="max-w-[72rem] mx-auto px-6 md:px-32">
        <div className="flex items-center gap-2 h-10 pl-6">
          <Icon
            icon="heroicons-outline:exclamation-circle"
            className="w-4 h-4 text-[#fa8b02] flex-shrink-0"
          />
          <p className="text-xs text-[#4a5565]">
            <span>{t("landing.policies.lastUpdated")}</span>{" "}
            <span className="font-semibold text-[#05073c]">
              {t("landing.policies.lastUpdatedDate")}
            </span>
            <span>. {t("landing.policies.policiesApplyNote")}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Intro Box                                                  */
/* ═══════════════════════════════════════════════════════════ */
const IntroBox = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-2xl px-7 py-7">
      <p className="text-sm leading-[1.421875rem] text-[#4a5565]">
        {t("landing.policies.introPrefix")}{" "}
        <span className="font-semibold text-[#05073c]">Pathora</span>
        {t("landing.policies.introSuffix")}
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Policy Card                                                */
/* ═══════════════════════════════════════════════════════════ */
const PolicyCard = ({ section }: { section: PolicySection }) => {
  return (
    <div className="bg-white border border-[#f3f4f6] rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-7 h-20 bg-[#f9fafb]/50 border-b border-[#f3f4f6]">
        <div className="w-10 h-10 rounded-[14px] bg-[#fff7ed] flex items-center justify-center flex-shrink-0">
          <Icon icon={section.icon} className="w-5 h-5 text-[#fa8b02]" />
        </div>
        <h2 className="text-base font-bold text-[#05073c]">
          {section.title}
        </h2>
      </div>

      {/* Bullet list */}
      <ul className="flex flex-col gap-3 px-7 py-5">
        {section.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-[18px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fa8b02] mt-[7px] flex-shrink-0" />
            <p className="text-sm leading-[1.421875rem] text-[#4a5565]">
              {item}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Policy Content States                                      */
/* ═══════════════════════════════════════════════════════════ */
const PolicyContentLoading = () => (
  <div className="flex flex-col gap-8 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white border border-[#f3f4f6] rounded-2xl shadow-sm overflow-hidden p-7"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[14px] bg-[#f3f4f6]" />
          <div className="h-5 bg-[#f3f4f6] rounded w-40" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-[#f3f4f6] rounded w-full" />
          <div className="h-4 bg-[#f3f4f6] rounded w-5/6" />
          <div className="h-4 bg-[#f3f4f6] rounded w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

const PolicyContentEmpty = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#fff7ed] flex items-center justify-center mb-4">
        <Icon icon="heroicons-outline:document-text" className="w-8 h-8 text-[#fa8b02]" />
      </div>
      <h3 className="text-lg font-semibold text-[#05073c] mb-2">
        {t("landing.policies.noContentTitle") || "No policies available"}
      </h3>
      <p className="text-sm text-[#6a7282] max-w-sm">
        {t("landing.policies.noContentDesc") || "Policy content will appear here once added."}
      </p>
    </div>
  );
};

const PolicyContentError = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <Icon icon="heroicons-outline:exclamation-circle" className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        {t("landing.policies.errorTitle") || "Failed to load policies"}
      </h3>
      <p className="text-sm text-[#6a7282] max-w-sm mb-6">{message}</p>
      <Button
        onClick={() => window.location.reload()}
        text={t("common.retry") || "Retry"}
        className="px-6 py-2.5 bg-[#fa8b02] text-white rounded-xl font-semibold"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  CTA Banner                                                 */
/* ═══════════════════════════════════════════════════════════ */
const CTABanner = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-[#05073c] rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center gap-6">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[#fa8b02]/20 flex items-center justify-center flex-shrink-0">
        <Icon
          icon="heroicons-outline:phone"
          className="w-7 h-7 text-[#fa8b02]"
        />
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-white">
          {t("landing.policies.ctaTitle")}
        </h3>
        <p className="text-sm text-white/60 mt-1">
          {t("landing.policies.ctaDescription")}
        </p>
      </div>

      {/* Button */}
      <Link
        href="/contact"
        className="bg-[#fa8b02] text-white font-semibold text-sm px-6 py-3 rounded-[14px] hover:brightness-110 transition-all whitespace-nowrap">
        {t("landing.policies.contactSupport")}
      </Link>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Floating Buttons                                           */
/* ═══════════════════════════════════════════════════════════ */
const FloatingButtons = () => (
  <div className="fixed right-4 bottom-[40%] z-50 flex flex-col gap-3 items-center">
    <a
      href="#"
      aria-label="Facebook"
      className="w-11 h-11 rounded-full bg-[#1877f2] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
      <Icon icon="mdi:facebook" className="w-5 h-5 text-white" />
    </a>
    <Button
      aria-label="Chat"
      className="w-11 h-11 rounded-full bg-[#fa8b02] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
      <Icon
        icon="heroicons-outline:chat-bubble-oval-left"
        className="w-5 h-5 text-white"
      />
    </Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
/*  Main Policy Page                                          */
/* ═══════════════════════════════════════════════════════════ */
export const PolicyPage = () => {
  const { content, loading, error } = useSiteContent("policies");

  const raw = content?.["policy-sections"];
  const { sections: policySections } = normalizePolicySections(raw);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden">
      {/* Header + Hero */}
      <div className="relative">
        <LandingHeader />
        <HeroBanner />
      </div>

      {/* Last Updated Notice */}
      <LastUpdatedBar />

      {/* Policy Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-[56rem] mx-auto px-6 flex flex-col gap-12">
          {/* Intro */}
          <IntroBox />

          {/* Policy Sections */}
          <div className="flex flex-col gap-8">
            {loading ? (
              <PolicyContentLoading />
            ) : error ? (
              <PolicyContentError message={error} />
            ) : policySections.length === 0 ? (
              <PolicyContentEmpty />
            ) : (
              policySections.map((section, idx) => (
                <PolicyCard key={section.id ?? idx} section={section} />
              ))
            )}
          </div>

          {/* CTA */}
          <CTABanner />
        </div>
      </section>

      {/* Floating Buttons */}
      <FloatingButtons />

      {/* Footer */}
      <LandingFooter />
    </main>
  );
};

export default PolicyPage;
