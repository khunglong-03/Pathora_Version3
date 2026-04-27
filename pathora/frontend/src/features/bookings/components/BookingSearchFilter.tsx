"use client";
import React from "react";
import TextInput from "@/components/ui/TextInput";
import { MagnifyingGlass, Funnel } from "@phosphor-icons/react";
import { FilterKey } from "./BookingHistoryData";
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 md:p-8 mb-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Search input */}
        <div className="relative flex-1 max-w-xl group">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-900 transition-colors z-10"
          />
          <TextInput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="!pl-14 !pr-6 !py-4 !rounded-[1.5rem] !border-slate-200 !text-base placeholder:!text-slate-400 focus:!ring-slate-900/10 focus:!border-slate-900 !bg-slate-50 focus:!bg-white transition-all w-full font-medium"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 px-2">
            <Funnel weight="bold" className="size-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {filterLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors overflow-hidden ${
                    isActive
                      ? "text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterBg"
                      className="absolute inset-0 bg-slate-900 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
