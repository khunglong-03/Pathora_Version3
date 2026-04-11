"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminService } from "@/api/services/adminService";
import { tourManagerAssignmentService, type TourManagerSummary } from "@/api/services/tourManagerAssignmentService";
import type { StaffMemberDto } from "@/types/admin";
import {
  AdminPageHeader,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { StaffList } from "@/features/dashboard/components/StaffList";
import { StaffReassignModal } from "@/features/dashboard/components/StaffReassignModal";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TourManagerStaffPage() {
  const params = useParams<{ id: string }>();
  const managerId = params?.id ?? "";

  const [staff, setStaff] = useState<StaffMemberDto[]>([]);
  const [managers, setManagers] = useState<TourManagerSummary[]>([]);
  const [currentManager, setCurrentManager] = useState<TourManagerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Reassign modal state
  const [reassignTarget, setReassignTarget] = useState<StaffMemberDto | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  const loadData = useCallback(async () => {
    if (!managerId) return;
    setIsLoading(true);
    setError(null);

    const [staffResult, allManagersResult] = await Promise.all([
      adminService.getTourManagerStaff(managerId),
      tourManagerAssignmentService.getAll(),
    ]);

    const manager = (allManagersResult.data ?? []).find((m) => m.managerId === managerId);

    if (staffResult && Array.isArray(staffResult.staff)) {
      setStaff(staffResult.staff);
    } else {
      setStaff([]);
    }

    if (allManagersResult.success && allManagersResult.data) {
      setManagers(allManagersResult.data);
      if (manager) {
        setCurrentManager(manager);
      }
    }

    setIsLoading(false);
  }, [managerId, reloadToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const handleReassign = async (targetManagerId: string) => {
    if (!reassignTarget || !managerId) return;
    setIsReassigning(true);

    const result = await adminService.reassignStaff(
      managerId,
      reassignTarget.id,
      targetManagerId,
    );

    setIsReassigning(false);
    if (result && typeof result === "object" && "success" in result && result.success) {
      // Refresh staff list
      setReloadToken((t) => t + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Nhân viên Tour Manager" backHref="/admin/tour-managers" />
        <SkeletonTable rows={5} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Nhân viên Tour Manager" backHref="/admin/tour-managers" />
        <AdminErrorCard message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Nhân viên Tour Manager"
        backHref="/admin/tour-managers"
        onRefresh={handleRefresh}
      />

      {/* Manager summary */}
      {currentManager && (
        <div
          className="rounded-xl border border-[#E5E7EB] bg-white p-5 mb-6"
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
              {getInitials(currentManager.managerName)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold" style={{ color: "#111827" }}>
                {currentManager.managerName}
              </h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {currentManager.managerEmail}
              </p>
            </div>
            <div className="flex gap-3">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
              >
                {currentManager.designerCount ?? 0} Designers
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
              >
                {currentManager.guideCount ?? 0} Guides
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Staff list */}
      <StaffList
        staff={staff}
        managers={managers}
        managerId={managerId}
        onReassign={(s) => setReassignTarget(s)}
      />

      {/* Reassign modal */}
      <StaffReassignModal
        isOpen={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        staffName={reassignTarget?.fullName ?? ""}
        currentManager={currentManager?.managerName ?? ""}
        allManagers={managers}
        onConfirm={handleReassign}
      />
    </div>
  );
}
