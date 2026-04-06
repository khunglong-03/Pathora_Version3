"use client";

import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end mb-10">
        <div className="space-y-3">
          <div className="h-4 w-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse" />
      </div>

      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[130px] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Row 2: 2 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[130px] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Row 3: chart + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 h-[360px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-4 h-[360px] rounded-xl bg-gray-100 animate-pulse" />
      </div>

      {/* Row 4: 3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-3 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-4 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
      </div>

      {/* Row 5: 2 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-5 h-[300px] rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
