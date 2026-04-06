"use client";

import React from "react";
import { motion } from "framer-motion";

export interface AdminFilterTab {
  label: string;
  value: string;
  count?: number;
}

interface AdminFilterTabsProps {
  tabs: AdminFilterTab[];
  activeValue: string;
  onChange: (value: string) => void;
}

export function AdminFilterTabs({ tabs, activeValue, onChange }: AdminFilterTabsProps) {
  if (!tabs.length) return null;

  return (
    <div
      className="flex items-center gap-1 p-1.5 rounded-xl"
      style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB" }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            onClick={() => onChange(tab.value)}
            className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            style={{
              color: isActive ? "#FFFFFF" : "#6B7280",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="admin-filter-tab-active"
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: "#C9873A" }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="relative z-10 inline-flex min-w-5 h-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                  color: isActive ? "#FFFFFF" : "#6B7280",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
