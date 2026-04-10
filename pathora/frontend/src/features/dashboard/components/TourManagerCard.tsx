"use client";

import React from "react";
import { UsersThree, PencilSimple } from "@phosphor-icons/react";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TourManagerCardProps {
  manager: TourManagerSummary;
  onViewStaff: (managerId: string) => void;
  onEdit: (managerId: string) => void;
}

export function TourManagerCard({ manager, onViewStaff, onEdit }: TourManagerCardProps) {
  return (
    <div
      data-testid="tour-manager-card"
      className="flex flex-col h-full rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
      }}
      onClick={() => onViewStaff(manager.managerId)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px -15px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px -15px rgba(0,0,0,0.05)";
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: "#C9873A" }}
        >
          {getInitials(manager.managerName)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
            {manager.managerName}
          </h3>
          <p className="text-xs truncate mt-0.5" style={{ color: "#6B7280" }}>
            {manager.managerEmail}
          </p>
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
        >
          Designers: {manager.designerCount}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
        >
          Guides: {manager.guideCount}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
        >
          Tours: {manager.tourCount}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewStaff(manager.managerId);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA]"
          style={{ color: "#374151" }}
        >
          <UsersThree size={14} weight="bold" />
          Xem nhân viên
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(manager.managerId);
          }}
          className="flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA]"
          style={{ color: "#374151" }}
          aria-label="Edit manager"
        >
          <PencilSimple size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
