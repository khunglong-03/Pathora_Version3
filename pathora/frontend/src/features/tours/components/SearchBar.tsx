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
    <div className="sticky top-0 z-40 backdrop-blur-sm bg-white/95 border-b border-slate-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
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
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            />
            <TextInput
              type="text"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={safeT("landing.tourDiscovery.searchFullPlaceholder", "Search tours, destinations, activities...")}
              className="!h-12 !bg-white !border-slate-200 !rounded-xl !pl-12 !pr-4 !text-sm !text-slate-900 placeholder:!text-slate-400 focus:!ring-[#fa8b02]/20 focus:!border-[#fa8b02] transition-colors"
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
        <div className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest.value}
              type="button"
              onClick={() => handleChipClick(dest.value)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 hover:shadow-sm transition-colors"
            >
              <Icon icon="heroicons-outline:map-pin" className="w-3.5 h-3.5 text-[#fa8b02]" />
              {dest.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
