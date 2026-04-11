"use client";

import React from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

interface StaffDetailPanelProps {
  manager: TourManagerSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StaffDetailPanel({
  manager,
  isLoading,
  onRefresh,
}: StaffDetailPanelProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-amber-500 animate-spin" />
          <p className="text-sm text-stone-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // No manager selected — empty state
  if (!manager) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-16 px-8">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-stone-300">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-500">
            Chọn 1 Tour Manager để xem chi tiết
          </p>
        </div>
      </div>
    );
  }

  // Manager header card (full width)
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div
        className="w-full max-w-2xl rounded-2xl border bg-white p-6"
        style={{
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
          borderLeft: "6px solid #C9873A",
        }}
      >
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ backgroundColor: "#C9873A" }}
          >
            {getInitials(manager.managerName)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold" style={{ color: "#111827" }}>
              {manager.managerName}
            </h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {manager.managerEmail}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <button
              onClick={onRefresh}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-stone-100"
              title="Làm mới"
              aria-label="Làm mới"
            >
              <ArrowClockwise size={20} style={{ color: "#6B7280" }} />
            </button>
            <div className="flex gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
              >
                {manager.designerCount ?? 0} Designers
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
              >
                {manager.guideCount ?? 0} Guides
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}