"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";

interface SearchBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
}

const QUICK_DESTINATIONS = [
  { label: "Ha Long Bay", value: "Ha Long Bay" },
  { label: "Hanoi", value: "Hanoi" },
  { label: "Sapa", value: "Sapa" },
  { label: "Mekong Delta", value: "Mekong Delta" },
  { label: "Da Nang", value: "Da Nang" },
  { label: "Hoi An", value: "Hoi An" },
];

export const SearchBar = ({
  searchText,
  onSearchChange,
  onSearchSubmit,
  onFilterToggle,
  showFilterButton = true,
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

  const handleChipClick = (destination: string) => {
    onSearchChange(destination);
    onSearchSubmit();
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-[0_4px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <Icon
              icon="heroicons-outline:search"
              className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-landing-body"
            />
            <TextInput
              type="text"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={safeT("landing.tourDiscovery.searchFullPlaceholder", "Search tours, destinations, activities...")}
              className="!h-14 !bg-white/80 backdrop-blur-md !border-none !rounded-2xl !pl-14 !pr-6 text-base !text-landing-heading shadow-sm placeholder:!text-slate-400 focus:!ring-2 focus:!ring-[#fa8b02]/30 transition-all"
            />
          </form>

          {/* Filter Button (Mobile only — sidebar always visible on desktop) */}
          {showFilterButton && (
            <Button
              type="button"
              onClick={onFilterToggle}
              className="lg:hidden flex items-center gap-2 h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              <Icon icon="lucide:sliders-horizontal" className="w-5 h-5" />
              <span>{safeT("landing.tourDiscovery.filtersLabel", "Filters")}</span>
            </Button>
          )}
        </div>

        {/* Quick destination chips */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest.value}
              type="button"
              onClick={() => handleChipClick(dest.value)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-landing-heading bg-white border border-white/40 shadow-sm rounded-full hover:bg-slate-50 hover:-translate-y-0.5 transition-all"
            >
              <Icon icon="heroicons-outline:map-pin" className="w-4 h-4 text-[#fa8b02]" />
              {dest.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
