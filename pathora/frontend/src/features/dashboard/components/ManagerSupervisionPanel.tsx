"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import type { StaffMemberDto } from "@/types/admin";
import { AddStaffModal } from "./AddStaffModal";

interface ManagerSupervisionPanelProps {
  managerId: string;
  staff: StaffMemberDto[];
  onStaffAdded: () => void;
}

export function ManagerSupervisionPanel({
  managerId,
  staff,
  onStaffAdded,
}: ManagerSupervisionPanelProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const designers = staff.filter((s) => s.role === "TourDesigner");
  const guides = staff.filter((s) => s.role === "TourGuide");

  return (
    <div
      className="rounded-xl border border-[#E5E7EB] bg-white p-6"
      style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <Icon icon="Users" className="size-5" style={{ color: "#C9873A" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
              Nhân viên được quản lý
            </h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {staff.length} người
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "#C9873A", color: "#FFFFFF" }}
        >
          <Icon icon="Plus" className="size-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Empty state */}
      {staff.length === 0 && (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <Icon icon="Users" className="size-8" style={{ color: "#9CA3AF" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#6B7280" }}>
            Chưa có nhân viên
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Thêm Tour Designer hoặc Tour Guide vào team
          </p>
        </div>
      )}

      {/* Staff lists */}
      {staff.length > 0 && (
        <div className="space-y-6">
          {/* Tour Designers */}
          {designers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="PaintBrush" className="size-4" style={{ color: "#7C3AED" }} />
                <h4 className="text-sm font-semibold" style={{ color: "#374151" }}>
                  Tour Designers ({designers.length})
                </h4>
              </div>
              <div className="space-y-2">
                {designers.map((designer) => (
                  <StaffCard key={designer.id} staff={designer} roleColor="#7C3AED" />
                ))}
              </div>
            </div>
          )}

          {/* Tour Guides */}
          {guides.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="MapTrifold" className="size-4" style={{ color: "#2563EB" }} />
                <h4 className="text-sm font-semibold" style={{ color: "#374151" }}>
                  Tour Guides ({guides.length})
                </h4>
              </div>
              <div className="space-y-2">
                {guides.map((guide) => (
                  <StaffCard key={guide.id} staff={guide} roleColor="#2563EB" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        managerId={managerId}
        onSuccess={onStaffAdded}
      />
    </div>
  );
}

function StaffCard({ staff, roleColor }: { staff: StaffMemberDto; roleColor: string }) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const statusStyle =
    staff.status === "Active"
      ? { bg: "#DCFCE7", dot: "#22C55E" }
      : { bg: "#F3F4F6", dot: "#9CA3AF" };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm"
      style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: roleColor }}
      >
        {getInitials(staff.fullName)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
          {staff.fullName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs truncate" style={{ color: "#6B7280" }}>
            {staff.email}
          </p>
        </div>
      </div>

      {/* Status */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
        style={{ backgroundColor: statusStyle.bg }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
        <span className="text-xs font-medium" style={{ color: "#374151" }}>
          {staff.status === "Active" ? "Hoạt động" : "Khóa"}
        </span>
      </div>
    </div>
  );
}
