"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80&auto=format&fit=crop";
const HERO_BLUR_URL =
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=20&q=10&auto=format&fit=crop";

export const HeroSection = () => {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeT = (key: string, fallback: string) => {
    return mounted ? t(key, fallback) : fallback;
  };

  return (
    <section className="relative h-[45vh] lg:h-[55vh] w-full overflow-hidden">
      {/* Background image — Ha Long Bay aerial */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE_URL}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Warm cream gradient overlay — photo-visible, readable headline */}
      <div
        suppressHydrationWarning
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(245,243,237,0.15), rgba(10,30,50,0.55))",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-16 lg:pt-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-8 lg:translate-x-0 flex items-center gap-2 text-sm"
        >
          <Link
            href="/home"
            className="text-white/50 hover:text-white transition-colors"
          >
            {safeT("landing.nav.home", "Home")}
          </Link>
          <Icon
            icon="heroicons-outline:chevron-right"
            className="w-3.5 h-3.5 text-white/50"
          />
          <span className="text-white/80">
            {safeT("landing.tourDiscovery.packageTours", "Package Tours")}
          </span>
        </nav>

        {/* Main title — two lines */}
        <h1 className="mb-4">
          <span className="block text-[28px] md:text-[36px] lg:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight">
            {safeT("landing.tourDiscovery.heroTitleLine1", "DISCOVER YOUR NEXT ADVENTURE")}
          </span>
          <span className="block text-[28px] md:text-[36px] lg:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight italic text-[#fa8b02]">
            {safeT("landing.tourDiscovery.heroTitleLine2", "IN VIETNAM")}
          </span>
        </h1>

        {/* Stats mini-cards */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <div className="flex items-center gap-2 bg-amber-50/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-amber-100">
            <Icon icon="heroicons-solid:star" className="w-5 h-5 text-[#fa8b02]" />
            <div className="text-left">
              <div className="text-lg font-bold text-[#1a1a2e] leading-none">24</div>
              <div className="text-xs text-slate-500 leading-none">curated tours</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-amber-100">
            <Icon icon="heroicons-solid:user-group" className="w-5 h-5 text-[#fa8b02]" />
            <div className="text-left">
              <div className="text-lg font-bold text-[#1a1a2e] leading-none">3,500+</div>
              <div className="text-xs text-slate-500 leading-none">travelers</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-amber-100">
            <Icon icon="heroicons-solid:map-pin" className="w-5 h-5 text-[#fa8b02]" />
            <div className="text-left">
              <div className="text-lg font-bold text-[#1a1a2e] leading-none">50+</div>
              <div className="text-xs text-slate-500 leading-none">destinations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
