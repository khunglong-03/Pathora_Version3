"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  adminService,
  type CreateStaffRequest,
  type TourManagerSummary,
} from "@/api/services/adminService";
import {
  tourManagerAssignmentService,
  ASSIGNED_ENTITY_TYPE,
} from "@/api/services/tourManagerAssignmentService";
import type { StaffMemberDto } from "@/types/admin";
import { ManagerListPanel } from "./components/ManagerListPanel";
import { StaffDetailPanel } from "./components/StaffDetailPanel";
import { StaffReassignModal } from "@/features/dashboard/components/StaffReassignModal";
import { AssignExistingModal } from "@/features/dashboard/components/AssignExistingModal";
import { CreateStaffModal } from "@/features/dashboard/components/CreateStaffModal";

export default function TourManagersPage() {
  const [managers, setManagers] = useState<TourManagerSummary[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [leftView, setLeftView] = useState<"managers" | "staff">("managers");
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staff, setStaff] = useState<StaffMemberDto[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  // Reassign modal
  const [reassignTarget, setReassignTarget] = useState<StaffMemberDto | null>(null);

  // Assign existing modal
  const [assignExistingRole, setAssignExistingRole] = useState<"TourDesigner" | "TourGuide" | null>(null);

  // Create staff modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const selectedManager = managers.find((m) => m.managerId === selectedManagerId) ?? null;

  // Load managers list
  useEffect(() => {
    let active = true;

    const loadManagers = async () => {
      setIsLoadingManagers(true);

      const result = await adminService.getAllManagers();

      if (!active) return;

      if (result) {
        setManagers(result);
      }
      setIsLoadingManagers(false);
    };

    void loadManagers();
    return () => { active = false; };
  }, [reloadToken]);

  // Load staff for selected manager
  const loadStaff = useCallback(async () => {
    if (!selectedManagerId) return;
    setIsLoadingStaff(true);

    const result = await adminService.getTourManagerStaff(selectedManagerId);

    if (result && Array.isArray(result.staffList)) {
      setStaff(result.staffList);
    } else {
      setStaff([]);
    }
    setIsLoadingStaff(false);
  }, [selectedManagerId]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleRefresh = () => {
    setReloadToken((t) => t + 1);
    void loadStaff();
  };

  const handleManagerSelect = (managerId: string) => {
    setSelectedManagerId(managerId);
    setLeftView("staff");
  };

  const handleReassign = async (targetManagerId: string) => {
    if (!reassignTarget || !selectedManagerId) return;
    const result = await adminService.reassignStaff(
      selectedManagerId,
      reassignTarget.id,
      targetManagerId,
    );
    if (result && typeof result === "object" && "success" in result && result.success) {
      setReloadToken((t) => t + 1);
      void loadStaff();
    }
  };

  const handleAssignExisting = async (userId: string) => {
    if (!selectedManagerId || !assignExistingRole) return;
    const entityType = assignExistingRole === "TourDesigner"
      ? ASSIGNED_ENTITY_TYPE.TourDesigner
      : ASSIGNED_ENTITY_TYPE.TourGuide;
    await tourManagerAssignmentService.bulkAssign(selectedManagerId, [
      {
        assignedUserId: userId,
        assignedEntityType: entityType,
        assignedRoleInTeam: null,
      },
    ]);
    setReloadToken((t) => t + 1);
    void loadStaff();
  };

  const handleCreateStaff = async (data: CreateStaffRequest) => {
    if (!selectedManagerId) return;
    await adminService.createStaffUnderManager(selectedManagerId, data);
    setReloadToken((t) => t + 1);
    void loadStaff();
    setCreateModalOpen(false);
  };

  const excludedUserIds = staff.map((s) => s.id);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Quản lý Tour Manager
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Danh sách và phân công nhân viên cho Tour Manager
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReloadToken((t) => t + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Làm mới
          </button>
          <Link
            href="/admin/tour-managers/create"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            + Thêm Tour Manager
          </Link>
        </div>
      </div>

      {/* Two-column master-detail layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
        style={{ minHeight: "calc(100vh - 14rem)" }}
      >
        <div className="grid grid-cols-[380px_1fr]" style={{ minHeight: "calc(100vh - 14rem)" }}>
          {/* Left: Manager list */}
          <div
            className="border-r border-stone-200 overflow-hidden"
            style={{ maxHeight: "calc(100vh - 14rem)" }}
          >
            <ManagerListPanel
              managers={managers}
              selectedManagerId={selectedManagerId}
              onSelect={handleManagerSelect}
              isLoading={isLoadingManagers}
              leftView={leftView}
              setLeftView={setLeftView}
              staff={staff}
              onReassign={(s) => setReassignTarget(s)}
            />
          </div>

          {/* Right: Staff detail */}
          <div
            className="overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 14rem)" }}
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              <StaffDetailPanel
                manager={selectedManager}
                isLoading={isLoadingStaff}
                onRefresh={handleRefresh}
              />
            </div>

            {/* Action buttons footer */}
            {selectedManagerId && !isLoadingStaff && (
              <div className="flex gap-2 justify-end px-4 py-4 border-t border-stone-200 bg-stone-50 shrink-0 mt-auto">
                <button
                  onClick={() => setAssignExistingRole("TourDesigner")}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200 hover:bg-[#EDE9FE]"
                  style={{ borderColor: "#C4B5FD", color: "#7C3AED", backgroundColor: "#FAFAFA" }}
                >
                  + Gán Designer
                </button>
                <button
                  onClick={() => setAssignExistingRole("TourGuide")}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200 hover:bg-[#DBEAFE]"
                  style={{ borderColor: "#BFDBFE", color: "#2563EB", backgroundColor: "#FAFAFA" }}
                >
                  + Gán Guide
                </button>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#C9873A" }}
                >
                  + Tạo nhân viên
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <StaffReassignModal
        isOpen={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        staffName={reassignTarget?.fullName ?? ""}
        currentManager={selectedManager?.managerName ?? ""}
        allManagers={managers}
        onConfirm={handleReassign}
      />

      <AssignExistingModal
        isOpen={!!assignExistingRole}
        onClose={() => setAssignExistingRole(null)}
        excludedUserIds={excludedUserIds}
        role={assignExistingRole ?? "TourDesigner"}
        onAssign={handleAssignExisting}
      />

      <CreateStaffModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateStaff}
      />
    </div>
  );
}
