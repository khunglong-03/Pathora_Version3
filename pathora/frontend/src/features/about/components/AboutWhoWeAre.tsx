"use client";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { WHO_WE_ARE_IMG } from "./AboutUsPageData";
import { motion, useMotionValue, useSpring } from "framer-motion";

const MagneticButton = ({ children, href }: { children: React.ReactNode; href: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const xPos = clientX - (left + width / 2);
    const yPos = clientY - (top + height / 2);
    x.set(xPos * 0.2); // Magnetic pull factor
    y.set(yPos * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div style={{ x: mouseXSpring, y: mouseYSpring }} className="inline-block relative z-10 w-fit">
      <Link
        ref={ref}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="mt-8 inline-flex items-center gap-2 bg-[#fa8b02] text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-[#fa8b02]/90 transition-colors relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        {/* Subtle inner glare for liquid feel */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
      </Link>
    </motion.div>
  );
};

const WhoWeAreSection = () => {
  const { t } = useTranslation();
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24">
      <div className="flex flex-col lg:flex-row gap-20 items-center">
        {/* Left: Image with Liquid Glass Refraction */}
        <div className="relative w-full lg:w-[50%] flex-shrink-0">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 p-2 border border-zinc-200/50 dark:border-white/5 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40">
            <div className="relative rounded-[2rem] overflow-hidden">
              <Image
                src={WHO_WE_ARE_IMG}
                alt={t("landing.aboutUs.whoWeAre")}
                width={700}
                height={500}
                className="w-full object-cover min-h-[400px]"
              />
              {/* Inner Refraction Ring */}
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] pointer-events-none" />
            </div>
            
            {/* Liquid Glass Experience badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="absolute -bottom-8 -right-4 md:-right-8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] px-8 py-6 text-zinc-900 dark:text-white"
            >
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] pointer-events-none dark:hidden" />
              <p className="text-4xl font-extrabold leading-8 tracking-tighter text-[#fa8b02]">15+</p>
              <p className="text-sm font-semibold opacity-60 mt-2">
                {t("landing.aboutUs.yearsExperience")}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right: Text */}
        <div className="flex-1 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#fa8b02] mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-[#fa8b02]/30" />
              {t("landing.aboutUs.whoWeAre")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.1] text-zinc-900 dark:text-zinc-50 tracking-tight">
              {t("landing.aboutUs.passionateTravelers")} <br />
              <span className="text-zinc-400 font-medium">
                {t("landing.aboutUs.expertGuides")}
              </span>
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              <p>{t("landing.aboutUs.whoWeAreDesc1")}</p>
              <p>{t("landing.aboutUs.whoWeAreDesc2")}</p>
            </div>
            
            <MagneticButton href="/tours">
              {t("landing.aboutUs.exploreOurTours")}
              <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4 ml-1" />
            </MagneticButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export { WhoWeAreSection };
