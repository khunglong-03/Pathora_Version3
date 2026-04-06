"use client";

import type { AdminDashboardTopTour } from "@/types/admin";

export interface TopToursTableProps {
  tours: AdminDashboardTopTour[];
  noDataText: string;
  formatMoney: (value: number) => string;
  delay?: number;
}

export default function TopToursTable({
  tours,
  noDataText,
  formatMoney,
}: TopToursTableProps) {
  if (tours.length === 0) {
    return (
      <div className="py-10 text-center text-sm rounded-xl border bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF]">
        {noDataText}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-1">
      {tours.map((tour, index) => {
        const rank = index + 1;
        const isRankOne = rank === 1;

        return (
          <div
            key={tour.name}
            className="flex items-center justify-between py-3.5 px-4 rounded-xl border-t cursor-default transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-[#F9FAFB] border-t-[#F3F4F6]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isRankOne
                    ? "bg-orange-100 text-[#F97316]"
                    : "bg-[#F3F4F6] text-[#9CA3AF]"
                }`}
                style={
                  isRankOne ? { backgroundColor: "rgba(249,115,22,0.1)" } : {}
                }
              >
                {rank}
              </div>
              <span className="text-sm truncate max-w-[8.75rem] text-[#6B7280]">
                {tour.name}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs tabular-nums text-[#9CA3AF]">
                {tour.bookings}
              </span>
              <span className="text-xs font-semibold tabular-nums text-[#10B981]">
                {formatMoney(tour.revenue)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
