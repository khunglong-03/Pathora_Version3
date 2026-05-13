"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";

interface SearchBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
  onContinentSelect?: (continentId: number | null) => void;
  activeContinent?: number | null;
}

/** Continent chips matching the backend Continent enum values.
 *  These mirror the home page "Bạn muốn đi đâu?" section for consistency. */
const CONTINENT_CHIPS = [
  { id: null, labelKey: "landing.tourDiscovery.continents.all", fallback: "Tất cả" },
  { id: 1,    labelKey: "landing.tourDiscovery.continents.asia", fallback: "Châu Á" },
  { id: 2,    labelKey: "landing.tourDiscovery.continents.europe", fallback: "Châu Âu" },
  { id: 4,    labelKey: "landing.tourDiscovery.continents.americas", fallback: "Châu Mỹ" },
  { id: 3,    labelKey: "landing.tourDiscovery.continents.africa", fallback: "Châu Phi" },
  { id: 5,    labelKey: "landing.tourDiscovery.continents.oceania", fallback: "Châu Đại Dương" },
];

export const SearchBar = ({
  searchText,
  onSearchChange,
  onSearchSubmit,
  onFilterToggle,
  showFilterButton = true,
  onContinentSelect,
  activeContinent = null,
}: SearchBarProps) => {
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
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-[0_4px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <form
            className="relative flex-1 group"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[1.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center p-1.5 rounded-[1.25rem] border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#fa8b02]/30 focus-within:border-[#fa8b02] transition-all">
              <div className="flex-1 w-full relative flex items-center h-11">
                <Icon
                  icon="heroicons-outline:search"
                  className="absolute left-4 text-slate-400 w-5 h-5"
                />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={safeT("landing.tourDiscovery.searchFullPlaceholder", "Tìm kiếm tour, điểm đến, hoạt động...")}
                  className="w-full h-full bg-transparent text-slate-900 placeholder:text-slate-400 pl-11 pr-4 outline-none border-none text-[15px] font-medium"
                />
              </div>

              <div className="shrink-0">
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#fa8b02] text-white font-semibold rounded-xl hover:bg-[#e67a00] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icon icon="heroicons-outline:magnifying-glass" className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">{safeT("landing.tourDiscovery.searchButton", "Tìm kiếm")}</span>
                  <Icon icon="heroicons-outline:arrow-right" className="w-4 h-4 hidden sm:block" />
                </button>
              </div>
            </div>
          </form>

          {/* Filter Button (Mobile only — sidebar always visible on desktop) */}
          {showFilterButton && (
            <Button
              type="button"
              onClick={onFilterToggle}
              className="lg:hidden flex items-center gap-2 h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              <Icon icon="lucide:sliders-horizontal" className="w-5 h-5" />
              <span>{safeT("landing.tourDiscovery.filtersLabel", "Bộ lọc")}</span>
            </Button>
          )}
        </div>

        {/* Continent filter chips — matches home page "Bạn muốn đi đâu?" */}
        {onContinentSelect && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {CONTINENT_CHIPS.map((chip) => (
              <button
                key={chip.id ?? "all"}
                type="button"
                onClick={() => onContinentSelect(chip.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                  activeContinent === chip.id
                    ? "bg-stone-900 text-white shadow-md"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                }`}
              >
                {safeT(chip.labelKey, chip.fallback)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
