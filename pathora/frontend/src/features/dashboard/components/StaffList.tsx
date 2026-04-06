"use client";

import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { StaffMemberDto } from "@/types/admin";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  TourDesigner: { bg: "#EDE9FE", text: "#7C3AED", label: "Tour Designer" },
  TourGuide: { bg: "#DBEAFE", text: "#2563EB", label: "Tour Guide" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface StaffListProps {
  staff: StaffMemberDto[];
  managers: TourManagerSummary[];
  managerId: string;
  onReassign: (staff: StaffMemberDto) => void;
}

export function StaffList({ staff, managers, managerId, onReassign }: StaffListProps) {
  const otherManagers = managers.filter((m) => m.managerId !== managerId);

  // Group staff by role
  const grouped = staff.reduce<Record<string, StaffMemberDto[]>>((acc, member) => {
    const role = member.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {});

  const roleOrder = ["TourDesigner", "TourGuide"];

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>
        Không có nhân viên nào.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roleOrder.map((role) => {
        const members = grouped[role];
        if (!members?.length) return null;
        const style = ROLE_COLORS[role] ?? { bg: "#F3F4F6", text: "#6B7280", label: role };

        return (
          <div key={role}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {style.label}
              </span>
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                {members.length} người
              </span>
            </div>

            {/* Staff rows */}
            <div className="space-y-2">
              {members.map((member) => {
                const isActive = member.status === "Active";
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] transition-colors duration-200"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "#C9873A" }}
                    >
                      {getInitials(member.fullName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                        {member.fullName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                        {member.email}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }}
                      />
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {isActive ? "Hoạt động" : "Khóa"}
                      </span>
                    </div>

                    {/* Reassign */}
                    {otherManagers.length > 0 && (
                      <button
                        onClick={() => onReassign(member)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA]"
                        style={{ color: "#C9873A" }}
                        aria-label={`Reassign ${member.fullName}`}
                      >
                        <ArrowRight size={12} weight="bold" />
                        Chuyển
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
