"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, CheckCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";

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
    <div className="pt-24 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-10"
        >
          <ArrowLeft weight="bold" className="size-4" />
          {backLabel}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl tracking-tighter leading-none font-bold text-slate-900"
            >
              {titleLabel}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-slate-500 leading-relaxed max-w-[65ch] mt-6"
            >
              {subtitleLabel}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
            className="flex flex-col sm:flex-row items-center gap-4 shrink-0"
          >
            {/* Total Bookings Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 min-w-[180px] w-full sm:w-auto flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ticket weight="fill" className="size-16 text-slate-900" />
              </div>
              <p className="text-4xl font-mono tracking-tight font-bold text-slate-900 relative z-10">{totalCount}</p>
              <p className="text-sm font-medium text-slate-500 mt-2 relative z-10">{totalBookingsLabel}</p>
            </div>

            {/* Active Bookings Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 min-w-[180px] w-full sm:w-auto flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle weight="fill" className="size-16 text-emerald-500" />
              </div>
              <p className="text-4xl font-mono tracking-tight font-bold text-emerald-500 relative z-10">{activeCount}</p>
              <p className="text-sm font-medium text-slate-500 mt-2 relative z-10">{activeLabel}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
