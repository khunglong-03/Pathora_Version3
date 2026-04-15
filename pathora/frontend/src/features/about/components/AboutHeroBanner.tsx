"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { HERO_BG } from "./AboutUsPageData";
import { motion } from "framer-motion";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
};

const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[100dvh] -mt-20 overflow-hidden flex items-center bg-zinc-950">
      {/* Background Image shifted to Right */}
      <div className="absolute inset-0 w-full h-full lg:w-3/4 lg:left-1/4">
        <Image
          src={HERO_BG}
          alt=""
          width={1474}
          height={640}
          className="w-full h-full object-cover opacity-80"
          priority
        />
        {/* Soft Vignette and Edge Fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-zinc-950/20" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-28 pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-2xl flex flex-col items-start text-left"
        >
          <motion.span
            variants={itemVariants}
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-[#fa8b02] bg-[#fa8b02]/10 border border-[#fa8b02]/20 mb-6"
          >
            {t("landing.aboutUs.ourStory")}
          </motion.span>
          
          <motion.h1
            variants={itemVariants}
            className={`${outfit.className} text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-white`}
          >
            {t("landing.aboutUs.weAre")}{" "}
            <span className="text-[#fa8b02] inline-block relative">
              Pathora
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#fa8b02]/40 rounded-full blur-[2px]"></span>
            </span>
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            className="mt-8 max-w-[500px] text-lg leading-relaxed text-zinc-400"
          >
            {t("landing.aboutUs.heroSubtitle")}
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-10 flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="text-zinc-500 hover:text-white transition-colors border border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-5 py-2.5 rounded-xl block"
            >
              {t("landing.nav.home")}
            </Link>
            <Icon
              icon="heroicons-outline:chevron-right"
              className="w-4 h-4 text-zinc-600"
            />
            <span className="text-zinc-300 font-medium px-5 py-2.5 rounded-xl border border-transparent">
              {t("landing.nav.aboutUs")}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export { HeroBanner };
