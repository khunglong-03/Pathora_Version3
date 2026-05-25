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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "mb-12 rounded-[2.5rem] border border-stone-200/50 bg-white p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(28,25,23,0.05)]"
      )}
    >
      <div className={cn("flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between")}>
        
        {/* Asymmetric Search input block with edge refraction border */}
        <div className={cn("group relative max-w-xl flex-1")}>
          <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone-400 transition-colors duration-300 group-focus-within:text-[#C9873A]">
            <MagnifyingGlass weight="bold" className="size-5" />
          </div>
          <TextInput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full !rounded-2xl !border-stone-200/60 !bg-stone-50 !py-4 !pl-12 !pr-4 text-sm font-semibold tracking-tight text-stone-900 transition-all duration-300 placeholder:!text-stone-400 focus:!border-[#C9873A] focus:!bg-white focus:!ring-4 focus:!ring-[#C9873A]/5 hover:!border-stone-300/80"
            )}
          />
        </div>

        {/* Filter Pills with elegant layout and custom springs */}
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center")}>
          <div className={cn("flex items-center gap-2.5 px-2")}>
            <Funnel weight="bold" className={cn("size-4 text-stone-400")} />
            <span suppressHydrationWarning className={cn("text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase font-sans")}>
              {filterLabel}
            </span>
          </div>
          
          <div className={cn("flex flex-wrap items-center gap-2.5")}>
            {filters.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={cn(
                    "relative overflow-hidden rounded-full px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300",
                    isActive
                      ? "text-white"
                      : "border border-stone-200/50 bg-stone-50/40 text-stone-500 hover:bg-stone-100/60 hover:text-stone-900 active:scale-95"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterBg"
                      className={cn("absolute inset-0 rounded-full bg-[#C9873A] shadow-[0_4px_12px_rgba(201,135,58,0.25)]")}
                      initial={false}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    />
                  )}
                  <span suppressHydrationWarning className={cn("relative z-10")}>
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
