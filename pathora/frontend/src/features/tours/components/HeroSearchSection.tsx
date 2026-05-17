"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80&auto=format&fit=crop";

const CONTINENT_CHIPS = [
  { id: null as number | null, labelKey: "landing.tourDiscovery.continents.all", fallback: "Tất cả" },
  { id: 1, labelKey: "landing.tourDiscovery.continents.asia", fallback: "Châu Á" },
  { id: 2, labelKey: "landing.tourDiscovery.continents.europe", fallback: "Châu Âu" },
  { id: 4, labelKey: "landing.tourDiscovery.continents.americas", fallback: "Châu Mỹ" },
  { id: 3, labelKey: "landing.tourDiscovery.continents.africa", fallback: "Châu Phi" },
  { id: 5, labelKey: "landing.tourDiscovery.continents.oceania", fallback: "Châu Đại Dương" },
];

interface HeroSearchSectionProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterToggle?: () => void;
  activeContinent: number | null;
  onContinentSelect: (id: number | null) => void;
}

export const HeroSearchSection = ({
  searchText,
  onSearchChange,
  onSearchSubmit,
  onFilterToggle,
  activeContinent,
  onContinentSelect,
}: HeroSearchSectionProps) => {
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
    <section className="relative h-[55vh] lg:h-[60vh] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE_URL}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Dark gradient overlay */}
      <div
        suppressHydrationWarning
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,30,50,0.35) 0%, rgba(10,30,50,0.65) 60%, rgba(10,30,50,0.85) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 pt-16 pb-8 lg:pt-20 lg:pb-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-8 lg:translate-x-0 flex items-center gap-2 text-sm"
        >
          <Link
            href="/"
            className="text-white/50 hover:text-white transition-colors"
          >
            {safeT("landing.nav.home", "Trang chủ")}
          </Link>
          <Icon
            icon="heroicons-outline:chevron-right"
            className="w-3.5 h-3.5 text-white/50"
          />
          <span className="text-white/80">
            {safeT("landing.tourDiscovery.packageTours", "Tour du lịch")}
          </span>
        </nav>

        {/* Title */}
        <h1 className="mb-6 text-center">
          <span className="block text-[26px] md:text-[34px] lg:text-[44px] font-extrabold text-white leading-[1.15] tracking-tight">
            {safeT("landing.tourDiscovery.heroTitleLine1", "KHÁM PHÁ CHUYẾN ĐI")}
          </span>
          <span className="block text-[26px] md:text-[34px] lg:text-[44px] font-extrabold leading-[1.15] tracking-tight italic text-[#fa8b02]">
            {safeT("landing.tourDiscovery.heroTitleLine2", "CÙNG PATHORA")}
          </span>
        </h1>

        {/* Search Bar — integrated into hero */}
        <div className="w-full max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="relative"
          >
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-[1.5rem] p-2 shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-white/30">
              {/* Search icon + input */}
              <div className="flex-1 flex items-center h-12 min-w-0">
                <Icon
                  icon="heroicons-outline:search"
                  className="ml-4 text-slate-400 w-5 h-5 shrink-0"
                />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={safeT("landing.tourDiscovery.searchFullPlaceholder", "Tìm kiếm tour, điểm đến, hoạt động...")}
                  className="w-full h-full bg-transparent text-slate-900 placeholder:text-slate-400 px-3 outline-none text-[15px] font-medium min-w-0"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="h-12 px-6 bg-[#fa8b02] text-white font-semibold rounded-xl hover:bg-[#e67a00] transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <Icon icon="heroicons-outline:magnifying-glass" className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">{safeT("landing.tourDiscovery.searchButton", "Tìm kiếm")}</span>
                <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4 hidden sm:block" />
              </button>

              {/* Filter button (mobile) */}
              {onFilterToggle && (
                <button
                  type="button"
                  onClick={onFilterToggle}
                  className="lg:hidden h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                >
                  <Icon icon="lucide:sliders-horizontal" className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {/* Continent chips */}
          <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CONTINENT_CHIPS.map((chip) => (
              <button
                key={chip.id ?? "all"}
                type="button"
                onClick={() => onContinentSelect(chip.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                  activeContinent === chip.id
                    ? "bg-[#fa8b02] text-white shadow-md"
                    : "bg-white/20 backdrop-blur-md text-white/90 border border-white/30 hover:bg-white/30"
                }`}
              >
                {safeT(chip.labelKey, chip.fallback)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
