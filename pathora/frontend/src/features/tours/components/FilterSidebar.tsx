"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { CustomizeBanner } from "./CustomizeBanner";
import type { TourDiscoveryInstanceType } from "@/utils/tourDiscoveryFilters";

interface FilterOption {
  value: string;
  labelKey: string;
  fallback: string;
}

const CLASSIFICATION_OPTIONS: FilterOption[] = [
  {
    value: "Standard Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.standard",
    fallback: "Standard Tour",
  },
  {
    value: "Premium Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.premium",
    fallback: "Premium Tour",
  },
  {
    value: "VIP / Luxury Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.vipLuxury",
    fallback: "VIP / Luxury Tour",
  },
  {
    value: "Budget Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.budget",
    fallback: "Budget Tour",
  },
  {
    value: "Private Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.private",
    fallback: "Private Tour",
  },
  {
    value: "Group Tour",
    labelKey: "landing.tourDiscovery.classificationOptions.group",
    fallback: "Group Tour",
  },
];

interface FilterSidebarProps {
  selectedClassifications: string[];
  onClassificationToggle: (value: string) => void;
  onClearFilters: () => void;
  showDepartureTypeFilter?: boolean;
  catalogInstanceType?: TourDiscoveryInstanceType;
  onCatalogInstanceTypeChange?: (value: TourDiscoveryInstanceType) => void;
}

const FilterSection = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 pb-4">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 hover:bg-transparent"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</span>
        <Icon
          icon={isOpen ? "heroicons-outline:chevron-up" : "heroicons-outline:chevron-down"}
          className="w-4 h-4 text-slate-400"
        />
      </Button>
      {/* Smooth collapsible using CSS grid-template-rows */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden pb-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const FilterCheckboxList = ({
  options,
  selected,
  onToggle,
  getLabel,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (optionValue: string) => void;
  getLabel: (key: string, fallback: string) => string;
}) => (
  <div className="flex flex-col gap-2">
    {options.map((option) => (
      <label
        key={option.value}
        className="flex items-center gap-3 cursor-pointer py-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <div
          role="checkbox"
          aria-checked={selected.includes(option.value)}
          tabIndex={0}
          onClick={() => onToggle(option.value)}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(option.value); } }}
          className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors duration-200 flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus:ring-2 focus:ring-[#fa8b02]/50 ${
            selected.includes(option.value)
              ? "border-[#fa8b02] bg-[#fa8b02]"
              : "border-slate-300 bg-white hover:border-[#fa8b02]/50"
          }`}
        >
          {selected.includes(option.value) && (
            <div className="w-1.5 h-1.5 rounded-full bg-white transition-all scale-100" />
          )}
        </div>
        <span>{getLabel(option.labelKey, option.fallback)}</span>
      </label>
    ))}
  </div>
);

export const FilterSidebar = ({
  selectedClassifications,
  onClassificationToggle,
  onClearFilters,
  showDepartureTypeFilter = false,
  catalogInstanceType = null,
  onCatalogInstanceTypeChange,
}: FilterSidebarProps) => {
  const { t } = useTranslation();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeT = (key: string, fallback: string) => {
    return mounted ? t(key, fallback) : fallback;
  };

  const hasActiveFilters =
    selectedClassifications.length > 0 || catalogInstanceType === "private";

  const activeFilterCount =
    selectedClassifications.length + (catalogInstanceType === "private" ? 1 : 0);

  return (
    <aside className="w-full lg:w-[280px] shrink-0">
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 sticky top-24 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Filter Header */}
        <div className="flex items-center justify-between gap-2 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:sliders-horizontal" className="w-4 h-4 text-landing-heading" />
            <span className="text-sm font-semibold text-landing-heading">
              {safeT("landing.tourDiscovery.filter", "Filters")}
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-[#fa8b02]/10 text-[#fa8b02] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-[#fa8b02] hover:text-[#e67a00] font-medium transition-colors"
            >
              {safeT("landing.tourDiscovery.clearAll", "Clear all")}
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pb-4 mb-4 border-b border-slate-100">
            {selectedClassifications.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => onClassificationToggle(cls)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 text-white text-xs rounded-full hover:bg-slate-700 transition-colors"
              >
                {cls}
                <Icon icon="heroicons-outline:x-mark" className="w-3 h-3" />
              </button>
            ))}
            {catalogInstanceType === "private" && onCatalogInstanceTypeChange && (
              <button
                type="button"
                onClick={() => onCatalogInstanceTypeChange(null)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 text-white text-xs rounded-full hover:bg-slate-700 transition-colors"
              >
                {safeT("landing.tourDiscovery.instanceType.privateTag", "Private departures")}
                <Icon icon="heroicons-outline:x-mark" className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Departure catalog type (public listing vs private) */}
        {showDepartureTypeFilter && onCatalogInstanceTypeChange && (
          <FilterSection title={safeT("landing.tourDiscovery.departureCatalogType", "Departure type").toUpperCase()}>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer py-1 text-sm text-slate-600 hover:text-slate-900">
                <input
                  type="radio"
                  name="catalog-instance-type"
                  className="accent-[#fa8b02] size-4"
                  checked={catalogInstanceType !== "private"}
                  onChange={() => onCatalogInstanceTypeChange(null)}
                />
                <span>{safeT("landing.tourDiscovery.instanceType.publicDepartures", "Public scheduled departures")}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer py-1 text-sm text-slate-600 hover:text-slate-900">
                <input
                  type="radio"
                  name="catalog-instance-type"
                  className="accent-[#fa8b02] size-4"
                  checked={catalogInstanceType === "private"}
                  onChange={() => onCatalogInstanceTypeChange("private")}
                />
                <span>{safeT("landing.tourDiscovery.instanceType.privateCharters", "Private departures")}</span>
              </label>
            </div>
          </FilterSection>
        )}

        {/* Classification Filter */}
        <FilterSection title={safeT("landing.tourDiscovery.classifications", "Classifications").toUpperCase()}>
          <FilterCheckboxList
            options={CLASSIFICATION_OPTIONS}
            selected={selectedClassifications}
            onToggle={onClassificationToggle}
            getLabel={safeT}
          />
        </FilterSection>

        {/* Customize Banner */}
        <div className="mt-6">
          <CustomizeBanner />
        </div>
      </div>
    </aside>
  );
};
