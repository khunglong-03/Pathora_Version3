"use client";

import React from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";
import type { StaffMemberDto } from "@/types/admin";
import { StaffList } from "@/features/dashboard/components/StaffList";

interface StaffDetailPanelProps {
  manager: TourManagerSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  staff: StaffMemberDto[];
  managers: TourManagerSummary[];
  onToggleStatus?: (staff: StaffMemberDto) => void;
  onEdit?: (staff: StaffMemberDto) => void;
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
  staff,
  managers,
  onToggleStatus,
  onEdit,
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

  // Manager header + staff list (full height, scrollable)
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      {/* Manager header card */}
      <div
        className="w-full rounded-2xl border bg-white p-5 shrink-0"
        style={{
          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.05)",
          borderLeft: "6px solid #C9873A",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ backgroundColor: "#C9873A" }}
          >
            {getInitials(manager.managerName)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold" style={{ color: "#111827" }}>
              {manager.managerName}
            </h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {manager.managerEmail}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-stone-100 shrink-0"
            title="Làm mới"
            aria-label="Làm mới"
          >
            <ArrowClockwiseIcon size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>
      </div>

      {/* Staff list below the manager card */}
      <div className="mt-6">
        <StaffList
          staff={staff}
          managers={managers}
          managerId={manager.managerId}
          onReassign={() => {}}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}