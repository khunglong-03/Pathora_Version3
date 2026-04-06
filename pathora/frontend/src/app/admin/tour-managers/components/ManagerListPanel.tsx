"use client";

import React from "react";
import { User } from "@phosphor-icons/react";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

interface ManagerListPanelProps {
  managers: TourManagerSummary[];
  selectedManagerId: string;
  onSelect: (managerId: string) => void;
  isLoading: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ManagerListPanel({ managers, selectedManagerId, onSelect, isLoading }: ManagerListPanelProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80">
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="flex-1 p-2">
          <SkeletonTable rows={6} columns={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
          Tour Manager
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {managers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mb-3">
              <User size={24} className="text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-500 mb-1">Chưa có Tour Manager</p>
            <p className="text-xs text-stone-400">Tạo Tour Manager đầu tiên để bắt đầu.</p>
          </div>
        ) : (
          managers.map((manager) => {
            const isSelected = manager.managerId === selectedManagerId;
            return (
              <button
                key={manager.managerId}
                onClick={() => onSelect(manager.managerId)}
                className="w-full text-left px-3 py-3 rounded-xl transition-all duration-200 hover:bg-stone-100"
                style={
                  isSelected
                    ? {
                        backgroundColor: "#FFFBEB",
                        borderLeft: "3px solid #C9873A",
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: "#C9873A" }}
                  >
                    {getInitials(manager.managerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isSelected ? "#92400E" : "#111827" }}
                    >
                      {manager.managerName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                      {manager.managerEmail}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span
                      className="inline-flex min-w-[1.6rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
                      title="Tour Designers"
                    >
                      {manager.designerCount}
                    </span>
                    <span
                      className="inline-flex min-w-[1.6rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
                      title="Tour Guides"
                    >
                      {manager.guideCount}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
