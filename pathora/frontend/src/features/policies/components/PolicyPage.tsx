"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import Button from "@/components/ui/Button";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";

import { useSiteContent } from "@/hooks/useSiteContent";
import type { PolicySection } from "@/types/siteContent";
import { normalizePolicySections } from "../utils/normalizePolicySections";

/* ── Motion & Style Constants ── */
const SPRING_TRANSITION = { type: "spring", stiffness: 100, damping: 20 } as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: SPRING_TRANSITION },
};

// ── Image Assets ──
const HERO_BG = "/images/about/policy_hero.png";

/* ═══════════════════════════════════════════════════════════ */
/*  Hero Banner (Bento Style)                                  */
/* ═══════════════════════════════════════════════════════════ */
const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <motion.div 
      variants={itemVariants}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[40vh]"
    >
      {/* Left: Text Content */}
      <div className="lg:col-span-5 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        
        <div className="relative z-10 flex flex-col items-start gap-6">
          <span className="flex items-center gap-1.5 bg-white/10 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.15em] border border-white/10 backdrop-blur-md">
            <Icon icon="heroicons-outline:shield-check" className="size-3.5 text-[#fa8b02]" />
            {t("landing.policies.transparencyFirst")}
          </span>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tighter text-white leading-[1.05]" style={{ textWrap: "balance" }}>
              {t("landing.policies.our")}{" "}
              <span className="text-[#fa8b02] relative inline-block">
                {t("landing.policies.policy")}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#fa8b02]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              </span>
            </h1>
            <p className="text-base text-slate-400 font-medium leading-relaxed max-w-sm mt-2">
              {t("landing.policies.heroSubtitle")}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-12 flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors">
            {t("landing.nav.home")}
          </Link>
          <Icon icon="heroicons-outline:chevron-right" className="w-4 h-4 text-slate-600" />
          <span className="text-slate-300">{t("landing.nav.ourPolicies")}</span>
        </div>
      </div>

      {/* Right: Image */}
      <div className="lg:col-span-7 rounded-[2.5rem] relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-slate-200 border border-slate-200/50 min-h-[300px] lg:min-h-full">
        <Image
          src={HERO_BG}
          alt="Policies Hero"
          fill
          priority
          className="object-cover transition-transform duration-1000 group-hover:scale-105 ease-out"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
        <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/10 pointer-events-none rounded-[2.5rem]" />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Last Updated & Intro Box (Combined into a sleek card)      */
/* ═══════════════════════════════════════════════════════════ */
const IntroSection = () => {
  const { t } = useTranslation();
  return (
    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
      <div className="flex-1 flex flex-col gap-2">
        <p className="text-lg leading-relaxed text-slate-600 font-medium">
          {t("landing.policies.introPrefix")}{" "}
          <span className="font-bold text-slate-900 tracking-tight">Pathora</span>
          {t("landing.policies.introSuffix")}
        </p>
      </div>
      
      <div className="w-px h-16 bg-slate-100 hidden md:block" />
      <div className="h-px w-full bg-slate-100 md:hidden" />
      
      <div className="flex items-center gap-4 shrink-0 bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5">
        <div className="size-12 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center shrink-0">
          <Icon icon="heroicons-outline:clock" className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            {t("landing.policies.lastUpdated")}
          </span>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            {t("landing.policies.lastUpdatedDate")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Policy Card                                                */
/* ═══════════════════════════════════════════════════════════ */
const PolicyCard = ({ section }: { section: PolicySection }) => {
  return (
    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 relative overflow-hidden group hover:border-slate-300 transition-colors duration-300">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 group-hover:opacity-[0.04] transition-all duration-700 pointer-events-none">
        <Icon icon={section.icon || "heroicons-outline:document-text"} className="size-48 text-slate-900" />
      </div>
      
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:bg-slate-900 transition-colors duration-300">
            <Icon icon={section.icon || "heroicons-outline:document-text"} className="size-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {section.title}
          </h2>
        </div>
        
        <ul className="flex flex-col gap-5">
          {section.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-5 group/item">
              <div className="mt-2.5 size-2 rounded-full bg-slate-200 flex-shrink-0 group-hover/item:bg-[#fa8b02] group-hover/item:scale-150 transition-all duration-300" />
              <p className="text-base leading-[1.8] text-slate-600 font-medium group-hover/item:text-slate-900 transition-colors">
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Policy Content States                                      */
/* ═══════════════════════════════════════════════════════════ */
const PolicyContentLoading = () => (
  <div className="flex flex-col gap-6 w-full">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-slate-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10">
        <div className="animate-pulse flex flex-col gap-8">
          <div className="flex items-center gap-5">
            <div className="size-14 rounded-2xl bg-slate-100 shrink-0" />
            <div className="h-6 bg-slate-100 rounded-lg w-48" />
          </div>
          <div className="flex flex-col gap-4 pl-19">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const PolicyContentEmpty = () => {
  const { t } = useTranslation();
  return (
    <motion.div variants={itemVariants} className="bg-white border border-slate-200/50 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
      <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
        <Icon icon="heroicons-outline:document-text" className="size-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
        {t("landing.policies.noContentTitle") || "No policies available"}
      </h3>
      <p className="text-base font-medium text-slate-500 max-w-md">
        {t("landing.policies.noContentDesc") || "Policy content will appear here once added."}
      </p>
    </motion.div>
  );
};

const PolicyContentError = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={itemVariants} className="bg-white border border-rose-100 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(225,29,72,0.05)] p-16 flex flex-col items-center justify-center text-center">
      <div className="size-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
        <Icon icon="heroicons-outline:exclamation-circle" className="size-10 text-rose-500" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
        {t("landing.policies.errorTitle") || "Failed to load policies"}
      </h3>
      <p className="text-base font-medium text-slate-500 max-w-md mb-8">{message}</p>
      <Button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold tracking-wide hover:bg-slate-800 transition-colors"
      >
        {t("common.retry") || "Retry"}
      </Button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  CTA Banner                                                 */
/* ═══════════════════════════════════════════════════════════ */
const CTABanner = () => {
  const { t } = useTranslation();
  return (
    <motion.div variants={itemVariants} className="bg-[#fa8b02] rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(250,139,2,0.3)]">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700" />
      
      <div className="relative z-10 flex items-center gap-6">
        <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
          <Icon icon="heroicons-outline:chat-bubble-bottom-center-text" className="size-8 text-white" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {t("landing.policies.ctaTitle")}
          </h3>
          <p className="text-sm font-medium text-white/80">
            {t("landing.policies.ctaDescription")}
          </p>
        </div>
      </div>

      <Link
        href="/contact"
        className="relative z-10 bg-white text-[#c96c00] font-bold tracking-wide px-8 py-4 rounded-full hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_-8px_rgba(0,0,0,0.2)] whitespace-nowrap"
      >
        {t("landing.policies.contactSupport")}
      </Link>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*  Floating Buttons                                           */
/* ═══════════════════════════════════════════════════════════ */
const FloatingButtons = () => (
  <div className="fixed right-6 bottom-28 z-50 flex flex-col gap-3">
    <a
      href="#"
      aria-label="Facebook"
      className="size-12 rounded-full bg-[#1877f2] shadow-[0_8px_20px_rgba(24,119,242,0.3)] flex items-center justify-center hover:-translate-y-1 hover:scale-110 transition-all duration-300"
    >
      <Icon icon="mdi:facebook" className="size-6 text-white" />
    </a>
    <Button
      aria-label="Chat"
      className="size-12 rounded-full bg-[#fa8b02] shadow-[0_8px_20px_rgba(250,139,2,0.3)] flex items-center justify-center hover:-translate-y-1 hover:scale-110 transition-all duration-300"
    >
      <Icon icon="heroicons-outline:chat-bubble-oval-left" className="size-6 text-white" />
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
      className="bg-[#f9fafb] text-slate-900 min-h-screen selection:bg-slate-900 selection:text-white pb-24"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-12 flex flex-col gap-6 md:gap-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6 md:gap-8"
        >
          {/* Hero Bento */}
          <HeroBanner />

          {/* Intro Section Bento */}
          <IntroSection />

          {/* Main Grid: 8 Cols content, 4 cols sidebar-like whitespace if needed, but for policies a centered column works best. */}
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
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
            
            {/* CTA Bento */}
            <CTABanner />
          </div>
        </motion.div>
      </div>

      <FloatingButtons />
    </main>
  );
};

export default PolicyPage;
