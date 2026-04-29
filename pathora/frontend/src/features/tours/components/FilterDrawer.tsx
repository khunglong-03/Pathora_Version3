"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Transition, TransitionChild } from "@headlessui/react";
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

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassifications: string[];
  onClassificationToggle: (value: string) => void;
  onClearFilters: () => void;
  showDepartureTypeFilter?: boolean;
  catalogInstanceType?: TourDiscoveryInstanceType;
  onCatalogInstanceTypeChange?: (value: TourDiscoveryInstanceType) => void;
}

export const FilterDrawer = ({
  isOpen,
  onClose,
  selectedClassifications,
  onClassificationToggle,
  onClearFilters,
  showDepartureTypeFilter = false,
  catalogInstanceType = null,
  onCatalogInstanceTypeChange,
}: FilterDrawerProps) => {
  const { t } = useTranslation();

  const activeFilterCount =
    selectedClassifications.length + (catalogInstanceType === "private" ? 1 : 0);

  return (
    <Transition show={isOpen}>
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <TransitionChild
          enter="transition-opacity duration-300 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        </TransitionChild>

        {/* Drawer */}
        <TransitionChild
          enter="transform transition duration-300 ease-out"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition duration-200 ease-in"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:sliders-horizontal" className="w-5 h-5 text-slate-900" />
                <span className="text-lg font-semibold text-slate-900">
                  {t("landing.tourDiscovery.filtersLabel", "Filters")}
                </span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-[#fa8b02]/10 text-[#fa8b02] rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <Button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 bg-transparent"
                icon="heroicons-outline:x"
                iconClass="w-5 h-5 text-slate-500"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {showDepartureTypeFilter && onCatalogInstanceTypeChange && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-1 border-b border-slate-100">
                    {t("landing.tourDiscovery.departureCatalogType", "Departure type")}
                  </h3>
                  <div className="flex flex-col gap-2 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer py-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name="catalog-instance-type-drawer"
                        className="accent-[#fa8b02] size-4"
                        checked={catalogInstanceType !== "private"}
                        onChange={() => onCatalogInstanceTypeChange(null)}
                      />
                      <span>{t("landing.tourDiscovery.instanceType.publicDepartures", "Public scheduled departures")}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer py-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name="catalog-instance-type-drawer"
                        className="accent-[#fa8b02] size-4"
                        checked={catalogInstanceType === "private"}
                        onChange={() => onCatalogInstanceTypeChange("private")}
                      />
                      <span>{t("landing.tourDiscovery.instanceType.privateCharters", "Private departures")}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Classification */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-1 border-b border-slate-100">
                  {t("landing.tourDiscovery.classification", "Classification")}
                </h3>
                <div className="flex flex-col gap-2 mt-3">
                  {CLASSIFICATION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {/* Radio-style circle with teal active state */}
                      <div
                        role="checkbox"
                        aria-checked={selectedClassifications.includes(option.value)}
                        tabIndex={0}
                        onClick={() => onClassificationToggle(option.value)}
                        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClassificationToggle(option.value); } }}
                        className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors duration-200 flex-shrink-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02] ${
                          selectedClassifications.includes(option.value)
                            ? "border-[#fa8b02] bg-[#fa8b02]"
                            : "border-slate-300 bg-white hover:border-[#fa8b02]/50"
                        }`}
                      >
                        {selectedClassifications.includes(option.value) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span>{t(option.labelKey, option.fallback)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customize Banner */}
              <div className="mt-8">
                <CustomizeBanner />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-3">
                <Button
                  onClick={onClearFilters}
                  className="flex-1 py-3 text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                >
                  {t("landing.tourDiscovery.clearAll", "Clear all")}
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 py-3 bg-[#fa8b02] text-white rounded-lg font-medium hover:bg-[#e67a00] transition-colors"
                >
                  {t("landing.tourDiscovery.showResults", "Show Results")}
                </Button>
              </div>
            </div>
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
};
