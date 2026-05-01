"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, CheckCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface BookingHistoryHeroProps {
  totalCount: number;
  activeCount: number;
  backLabel: string;
  titleLabel: string;
  subtitleLabel: string;
  totalBookingsLabel: string;
  activeLabel: string;
}

export function BookingHistoryHero({
  totalCount,
  activeCount,
  backLabel,
  titleLabel,
  subtitleLabel,
  totalBookingsLabel,
  activeLabel,
}: BookingHistoryHeroProps) {
  return (
    <div className={cn("pb-8 pt-24")}>
      <div className={cn("mx-auto w-full max-w-[1400px] px-4 md:px-8")}>
        <Link
          href="/"
          suppressHydrationWarning
          className={cn("h-stack mb-10 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900")}
        >
          <ArrowLeft weight="bold" className={cn("size-4")} />
          {backLabel}
        </Link>

        <div className={cn("v-stack justify-between gap-10 lg:h-stack lg:items-end")}>
          <div className={cn("max-w-2xl")}>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              suppressHydrationWarning
              className={cn("text-4xl font-bold leading-none tracking-tighter text-slate-900 md:text-6xl")}
            >
              {titleLabel}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              suppressHydrationWarning
              className={cn("mt-6 max-w-[65ch] text-base leading-relaxed text-slate-500")}
            >
              {subtitleLabel}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
            className={cn("v-stack shrink-0 gap-4 sm:h-stack")}
          >
            {/* Total Bookings Card */}
            <div className={cn("v-stack w-full min-w-[160px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto")}>
              <p className={cn("text-xs font-semibold uppercase tracking-widest text-slate-400")}>{totalBookingsLabel}</p>
              <p className={cn("mt-1 font-mono text-3xl font-medium text-slate-900")}>{totalCount}</p>
            </div>

            {/* Active Bookings Card */}
            <div className={cn("v-stack w-full min-w-[160px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:w-auto")}>
              <p className={cn("text-xs font-semibold uppercase tracking-widest text-slate-400")}>{activeLabel}</p>
              <p className={cn("mt-1 font-mono text-3xl font-medium text-emerald-600")}>{activeCount}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
