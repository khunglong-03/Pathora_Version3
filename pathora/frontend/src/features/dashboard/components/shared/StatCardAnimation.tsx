"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import Icon from "@/components/ui/Icon";

export interface StatCardAnimationProps {
  label: string;
  value: number;
  accent: "stone" | "green" | "red" | "amber";
  icon: string;
  variants?: Variants;
}

const ACCENT_CONFIGS: Record<
  StatCardAnimationProps["accent"],
  { bg: string; text: string; border: string }
> = {
  stone: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-300" },
  green: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-400" },
  red: { bg: "bg-red-50", text: "text-red-500", border: "border-red-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-400" },
};

export function StatCardAnimation({
  label,
  value,
  accent,
  icon,
  variants,
}: StatCardAnimationProps) {
  const c = ACCENT_CONFIGS[accent];

  return (
    <motion.div
      variants={variants}
      className={`relative overflow-hidden bg-white rounded-[2.5rem] border border-stone-200/50 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${c.bg}`}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-stone-900 mt-1 data-value">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.bg} border-l-2 ${c.border}`}>
          <Icon icon={icon} className={`size-5 ${c.text}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default StatCardAnimation;
