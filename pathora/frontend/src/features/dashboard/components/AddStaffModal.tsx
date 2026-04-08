"use client";

import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { adminService } from "@/api/services/adminService";
import { tourManagerAssignmentService, ASSIGNED_ENTITY_TYPE } from "@/api/services/tourManagerAssignmentService";
import type { AdminUserListItem } from "@/types/admin";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  onSuccess: () => void;
}

type StaffType = "TourDesigner" | "TourGuide";

export function AddStaffModal({ isOpen, onClose, managerId, onSuccess }: AddStaffModalProps) {
  const [selectedType, setSelectedType] = useState<StaffType>("TourDesigner");
  const [availableStaff, setAvailableStaff] = useState<AdminUserListItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available staff when type changes
  const loadAvailableStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedStaffId("");

    try {
      const result = await adminService.getAllUsers({
        role: selectedType,
        status: "Active",
        limit: 100, // Get all active users of this role
      });

      if (result && result.items) {
        setAvailableStaff(result.items);
      } else {
        setAvailableStaff([]);
      }
    } catch (err) {
      setError("Không thể tải danh sách nhân viên");
      setAvailableStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    if (isOpen) {
      void loadAvailableStaff();
    }
  }, [isOpen, loadAvailableStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId) {
      setError("Vui lòng chọn nhân viên");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use the tourManagerAssignmentService to assign staff
      await tourManagerAssignmentService.assign({
        tourManagerUserId: managerId,
        assignments: [
          {
            assignedUserId: selectedStaffId,
            assignedEntityType:
              selectedType === "TourDesigner"
                ? ASSIGNED_ENTITY_TYPE.TourDesigner
                : ASSIGNED_ENTITY_TYPE.TourGuide,
            assignedRoleInTeam: null,
          },
        ],
      });

      onSuccess();
      onClose();
      // Reset form
      setSelectedType("TourDesigner");
      setSelectedStaffId("");
    } catch (err) {
      setError("Không thể thêm nhân viên. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType("TourDesigner");
      setSelectedStaffId("");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal activeModal={isOpen} onClose={handleClose} title="Thêm nhân viên">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Staff Type Selection */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "#374151" }}>
            Loại nhân viên
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === "TourDesigner"
                  ? "border-[#7C3AED] bg-[#F5F3FF]"
                  : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
              }`}
            >
              <input
                type="radio"
                name="staffType"
                value="TourDesigner"
                checked={selectedType === "TourDesigner"}
                onChange={(e) => setSelectedType(e.target.value as StaffType)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: selectedType === "TourDesigner" ? "#7C3AED" : "#D1D5DB",
                }}
              >
                {selectedType === "TourDesigner" && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#7C3AED" }} />
                )}
              </div>
              <Icon
                icon="PaintBrush"
                className="size-5 shrink-0"
                style={{ color: selectedType === "TourDesigner" ? "#7C3AED" : "#6B7280" }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: selectedType === "TourDesigner" ? "#7C3AED" : "#374151" }}
                >
                  Tour Designer
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Thiết kế và lên kế hoạch tour
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === "TourGuide"
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
              }`}
            >
              <input
                type="radio"
                name="staffType"
                value="TourGuide"
                checked={selectedType === "TourGuide"}
                onChange={(e) => setSelectedType(e.target.value as StaffType)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: selectedType === "TourGuide" ? "#2563EB" : "#D1D5DB",
                }}
              >
                {selectedType === "TourGuide" && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#2563EB" }} />
                )}
              </div>
              <Icon
                icon="MapTrifold"
                className="size-5 shrink-0"
                style={{ color: selectedType === "TourGuide" ? "#2563EB" : "#6B7280" }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: selectedType === "TourGuide" ? "#2563EB" : "#374151" }}
                >
                  Tour Guide
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Hướng dẫn và điều hành tour
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Staff Selection Dropdown */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
            Chọn nhân viên
          </label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C9873A] border-t-transparent" />
            </div>
          ) : availableStaff.length === 0 ? (
            <div
              className="text-center py-8 rounded-lg border"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
            >
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Không có {selectedType === "TourDesigner" ? "Tour Designer" : "Tour Guide"} khả dụng
              </p>
            </div>
          ) : (
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                borderColor: "#D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#111827",
              }}
            >
              <option value="">-- Chọn nhân viên --</option>
              {availableStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} ({staff.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Icon icon="Warning" className="size-5 shrink-0" style={{ color: "#DC2626" }} />
            <p className="text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[#F3F4F6]"
            style={{ color: "#6B7280" }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedStaffId}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#C9873A", color: "#FFFFFF" }}
          >
            {isSubmitting ? "Đang thêm..." : "Thêm nhân viên"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
