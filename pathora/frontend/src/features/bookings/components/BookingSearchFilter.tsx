"use client";
import React from "react";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { FilterKey } from "./BookingHistoryData";

interface FilterOption {
  key: FilterKey;
  label: string;
}

interface BookingSearchFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  filters: FilterOption[];
  searchPlaceholder: string;
  filterLabel: string;
}

export function BookingSearchFilter({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filters,
  searchPlaceholder,
  filterLabel,
}: BookingSearchFilterProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search input */}
        <div className="relative flex-1 md:max-w-md">
          <Icon
            icon="heroicons:magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
          />
          <TextInput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="!pl-10 !pr-4 !py-2.5 !rounded-xl !border-gray-200 !text-sm placeholder:!text-gray-400 focus:!ring-orange-500/20 focus:!border-orange-500"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-1">
            <Icon icon="heroicons:funnel" className="size-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400">
              {filterLabel}:
            </span>
          </div>
          {filters.map((f) => (
            <Button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === f.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
