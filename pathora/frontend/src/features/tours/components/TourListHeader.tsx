"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

interface TourListHeaderProps {
  totalTours: number;
  sortBy: string;
  viewType: "tour" | "tourInstance";
  onSortChange: (value: string) => void;
  onViewTypeChange: (value: "tour" | "tourInstance") => void;
}

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "duration-short", label: "Duration: Shortest" },
  { value: "duration-long", label: "Duration: Longest" },
];

export const TourListHeader = ({
  totalTours,
  sortBy,
  viewType,
  onSortChange,
  onViewTypeChange,
}: TourListHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Left side: View type tabs + Results count */}
      <div className="flex items-center gap-4">
        {/* View type tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onViewTypeChange("tour")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewType === "tour"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("landing.tourDiscovery.viewType.tour", "Tours")}
          </button>
          <button
            type="button"
            onClick={() => onViewTypeChange("tourInstance")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewType === "tourInstance"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("landing.tourDiscovery.viewType.tourInstance", "Tour Instances")}
          </button>
        </div>

        {/* Results count */}
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">{totalTours}</span>{" "}
          {t("landing.tourDiscovery.toursFound", "tours found")}
        </p>
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t("landing.tourDiscovery.sortBy", "Sort by")}:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#fa8b02]/20 focus:border-[#fa8b02] cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`landing.tourDiscovery.sort.${option.value}`, option.label)}
              </option>
            ))}
          </select>
          <Icon
            icon="heroicons-outline:chevron-down"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
