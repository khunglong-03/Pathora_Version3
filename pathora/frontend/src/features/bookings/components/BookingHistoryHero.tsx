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
    <div className={cn("pb-10 pt-28 relative overflow-hidden")}>
      {/* Dynamic Background Mesh Gradient */}
      <div className="absolute top-0 left-0 right-0 -z-10 h-[40rem] pointer-events-none bg-[radial-gradient(circle_at_12%_15%,rgba(201,135,58,0.12),transparent_35%),radial-gradient(circle_at_88%_25%,rgba(16,185,129,0.08),transparent_32%),linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]" />

      <div className={cn("mx-auto w-full max-w-[1400px] px-6 md:px-10")}>
        {/* Back Link with magnetic-like tactile feel */}
        <Link
          href="/"
          suppressHydrationWarning
          className={cn(
            "group inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-stone-400 transition-all duration-300 hover:text-stone-900 hover:-translate-x-1"
          )}
        >
          <ArrowLeft weight="bold" className={cn("size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5")} />
          {backLabel}
        </Link>

        {/* Split asymmetric layout */}
        <div className={cn("mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between")}>
          <div className={cn("max-w-2xl space-y-6")}>
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              suppressHydrationWarning
              className={cn(
                "text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-stone-950 md:text-7xl font-sans"
              )}
            >
              {titleLabel}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              suppressHydrationWarning
              className={cn(
                "max-w-[55ch] text-base leading-relaxed text-stone-500 font-medium"
              )}
            >
              {subtitleLabel}
            </motion.p>
          </div>

          {/* Premium Bento Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
            className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex lg:shrink-0")}
          >
            {/* Total Bookings Card */}
            <div className="group rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_20px_50px_-30px_rgba(28,25,23,0.3)] lg:min-w-[200px]">
              <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 border border-slate-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(28,25,23,0.45)]">
                <div className="flex items-center gap-3 justify-between">
                  <span className="rounded-full bg-stone-950/[0.035] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                    {totalBookingsLabel}
                  </span>
                  <div className="size-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                    <Ticket className="size-4 text-[#C9873A]" weight="bold" />
                  </div>
                </div>
                <p className="mt-5 font-mono text-4xl font-bold tracking-tight text-stone-900">
                  {totalCount}
                </p>
              </div>
            </div>

            {/* Active Bookings Card */}
            <div className="group rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_20px_50px_-30px_rgba(28,25,23,0.3)] lg:min-w-[200px]">
              <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 border border-slate-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(28,25,23,0.45)]">
                <div className="flex items-center gap-3 justify-between">
                  <span className="rounded-full bg-stone-950/[0.035] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                    {activeLabel}
                  </span>
                  <div className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
                <p className="mt-5 font-mono text-4xl font-bold tracking-tight text-emerald-600">
                  {activeCount}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
