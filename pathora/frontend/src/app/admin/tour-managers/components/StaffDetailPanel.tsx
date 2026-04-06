"use client";

import React from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import type { StaffMemberDto } from "@/types/admin";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";
import { AdminErrorCard } from "@/features/dashboard/components/AdminErrorCard";
import { StaffList } from "@/features/dashboard/components/StaffList";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

interface StaffDetailPanelProps {
  managerId: string;
  manager: TourManagerSummary | null;
  staff: StaffMemberDto[];
  managers: TourManagerSummary[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReassign: (staff: StaffMemberDto) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StaffDetailPanel({
  managerId,
  manager,
  staff,
  managers,
  isLoading,
  error,
  onRefresh,
  onReassign,
}: StaffDetailPanelProps) {
  // No manager selected — empty state
  if (!managerId) {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-stone-200">
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-4">
          <SkeletonTable rows={5} columns={3} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <AdminErrorCard message={error} onRetry={onRefresh} />
      </div>
    );
  }

  // Loaded state — manager header card + staff list
  return (
    <div className="flex flex-col h-full">
      {/* Manager header card */}
      {manager && (
        <div
          className="mx-4 mt-4 rounded-xl border bg-white p-5"
          style={{
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #C9873A",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: "#C9873A" }}
            >
              {getInitials(manager.managerName)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold" style={{ color: "#111827" }}>
                {manager.managerName}
              </h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {manager.managerEmail}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-stone-100"
                title="Làm mới"
                aria-label="Làm mới"
              >
                <ArrowClockwise size={18} style={{ color: "#6B7280" }} />
              </button>
              <div className="flex gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
                >
                  {manager.designerCount ?? 0} Designers
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
                >
                  {manager.guideCount ?? 0} Guides
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="flex-1 overflow-y-auto p-4">
        <StaffList
          staff={staff}
          managers={managers}
          managerId={managerId}
          onReassign={onReassign}
        />
      </div>
    </div>
  );
}