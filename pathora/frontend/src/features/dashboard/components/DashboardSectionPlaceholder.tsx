"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench } from "@phosphor-icons/react";

interface DashboardSectionPlaceholderProps {
  title: string;
  description: string;
}

export default function DashboardSectionPlaceholder({
  title,
  description,
}: DashboardSectionPlaceholderProps) {
  return (
    <div className="min-h-[100dvh] bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.05 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
        >
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-400 via-amber-500 to-amber-600" />

          {/* Noise texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative p-10 sm:p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.15 }}
              className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50"
            >
              <Wrench size={28} weight="duotone" className="text-amber-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
              className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.25 }}
              className="mt-3 text-sm leading-relaxed text-stone-500 sm:text-base"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
              className="mt-5 flex items-center gap-2"
            >
              <span className="inline-block h-px w-8 bg-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                Under construction
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-stone-800 hover:shadow-md active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to dashboard
              </Link>
              <Link
                href="/tour-management"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2a4 4 0 100 8 4 4 0 000-8zM2 14c0-2.2 2.7-4 6-4s6 1.8 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Manage tours
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
