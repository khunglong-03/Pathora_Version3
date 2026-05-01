"use client";
import React from "react";
import TextInput from "@/components/ui/TextInput";
import { MagnifyingGlass, Funnel } from "@phosphor-icons/react";
import { FilterKey } from "./BookingHistoryData";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

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
      className={cn("mb-10 rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] md:p-8")}
    >
      <div className={cn("v-stack justify-between gap-8 lg:h-stack lg:items-center")}>
        {/* Search input */}
        <div className={cn("group relative max-w-xl flex-1")}>
          <MagnifyingGlass
            weight="bold"
            className={cn("absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900")}
          />
          <TextInput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn("w-full !rounded-[1.5rem] !border-slate-200 !bg-slate-50 !py-4 !pl-14 !pr-6 text-base font-medium transition-all placeholder:!text-slate-400 focus:!border-slate-900 focus:!bg-white focus:!ring-slate-900/10")}
          />
        </div>

        {/* Filter pills */}
        <div className={cn("v-stack gap-4 sm:h-stack sm:items-center")}>
          <div className={cn("h-stack items-center gap-2 px-2")}>
            <Funnel weight="bold" className={cn("size-4 text-slate-400")} />
            <span suppressHydrationWarning className={cn("text-xs font-bold tracking-widest text-slate-400 uppercase")}>
              {filterLabel}
            </span>
          </div>
          <div className={cn("h-stack flex-wrap items-center gap-2")}>
            {filters.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={cn(
                    "relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "text-white"
                      : "border border-slate-200/60 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterBg"
                      className={cn("absolute inset-0 rounded-full bg-slate-900")}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span suppressHydrationWarning className={cn("relative z-10")}>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
