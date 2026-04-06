"use client";

import React, { useState } from "react";
import { X } from "@phosphor-icons/react";
import type { StaffMemberDto } from "@/types/admin";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

interface StaffReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  currentManager: string;
  allManagers: TourManagerSummary[];
  onConfirm: (targetManagerId: string) => Promise<void>;
}

export function StaffReassignModal({
  isOpen,
  onClose,
  staffName,
  currentManager,
  allManagers,
  onConfirm,
}: StaffReassignModalProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedManagerId) return;
    setIsLoading(true);
    try {
      await onConfirm(selectedManagerId);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "#111827" }}>
            Chuyển nhân viên
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6]"
            aria-label="Close modal"
          >
            <X size={18} weight="bold" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Staff info */}
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <p className="text-sm font-medium" style={{ color: "#374151" }}>
            {staffName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Hiện tại: {currentManager}
          </p>
        </div>

        {/* Manager dropdown */}
        <div className="mb-6">
          <label
            htmlFor="target-manager"
            className="block text-sm font-medium mb-2"
            style={{ color: "#374151" }}
          >
            Chuyển đến Manager
          </label>
          <select
            id="target-manager"
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:border-[#C9873A] focus:ring-2 focus:ring-amber-500/20"
            style={{ color: "#111827" }}
          >
            <option value="">-- Chọn Manager --</option>
            {allManagers.map((mgr) => (
              <option key={mgr.managerId} value={mgr.managerId}>
                {mgr.managerName} ({mgr.managerEmail})
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA]"
            style={{ color: "#374151" }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedManagerId || isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#C9873A" }}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
