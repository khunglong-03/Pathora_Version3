"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

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
    <div className="bg-linear-to-r from-[#05073c] to-[#05073c]/90 pt-24 pb-10">
      <div className="max-w-330 mx-auto px-4 md:px-6">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors mb-6"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          {backLabel}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{titleLabel}</h1>
            <p className="text-sm text-white/70 mt-2">{subtitleLabel}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center min-w-[76px]">
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-white/60">{totalBookingsLabel}</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center min-w-[76px]">
              <p className="text-2xl font-bold text-orange-400">{activeCount}</p>
              <p className="text-xs text-white/60">{activeLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
