"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  adminService,
  type CreateStaffRequest,
  type UpdateStaffRequest,
  type TourManagerSummary,
} from "@/api/services/adminService";
import {
  tourManagerAssignmentService,
  ASSIGNED_ENTITY_TYPE,
} from "@/api/services/tourManagerAssignmentService";
import { userService } from "@/api/services/userService";
import type { StaffMemberDto } from "@/types/admin";
import { ManagerListPanel } from "./components/ManagerListPanel";
import { StaffDetailPanel } from "./components/StaffDetailPanel";
import { StaffReassignModal } from "@/features/dashboard/components/StaffReassignModal";
import { AssignExistingModal } from "@/features/dashboard/components/AssignExistingModal";
import { CreateStaffModal } from "@/features/dashboard/components/CreateStaffModal";
import { UpdateStaffModal } from "@/features/dashboard/components/UpdateStaffModal";
import { TeamAssignmentModal } from "./components/TeamAssignmentModal";
import { logToServer } from "./actions";

export default function TourManagersPage() {
  const [managers, setManagers] = useState<TourManagerSummary[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
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

  // Update staff modal
  const [staffToUpdate, setStaffToUpdate] = useState<StaffMemberDto | null>(null);

  // Team assignment modal
  const [teamAssignModalOpen, setTeamAssignModalOpen] = useState(false);

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

    if (result && Array.isArray(result.staff)) {
      setStaff(result.staff);
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

  const handleUpdateStaff = async (data: UpdateStaffRequest) => {
    if (!selectedManagerId || !staffToUpdate) return;
    await adminService.updateStaffUnderManager(selectedManagerId, staffToUpdate.id, data);
    setReloadToken((t) => t + 1);
    void loadStaff();
    setStaffToUpdate(null);
  };

  const handleToggleStatus = async (staffMember: StaffMemberDto) => {
    const isCurrentlyActive = staffMember.status === "Active";
    const actionText = isCurrentlyActive ? "KHÓA" : "MỞ KHÓA";
    
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của nhân viên "${staffMember.fullName}" không?`)) {
      return;
    }

    try {
      const newStatus = isCurrentlyActive ? "Inactive" : "Active";
      
      console.log("Toggle user status payload:", { userId: staffMember.id, newStatus });
      await logToServer("Toggle user status payload:", { userId: staffMember.id, newStatus });
      
      await userService.updateStatus({
        userId: staffMember.id,
        newStatus,
      });
      setReloadToken((t) => t + 1);
      void loadStaff();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const excludedUserIds = staff.map((s) => s.id);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý Tour Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách và phân công nhân viên cho Tour Manager
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReloadToken((t) => t + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-input text-foreground hover:bg-muted transition-colors"
          >
            Làm mới
          </button>
          <Link
            href="/admin/tour-managers/create"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Thêm Tour Manager
          </Link>
        </div>
      </div>

      {/* Two-column master-detail layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-input rounded-2xl overflow-hidden shadow-sm"
        style={{ minHeight: "calc(100vh - 14rem)" }}
      >
        <div className="grid grid-cols-[380px_1fr]" style={{ minHeight: "calc(100vh - 14rem)" }}>
          {/* Left: Manager list */}
          <div
            className="border-r border-input overflow-hidden"
            style={{ maxHeight: "calc(100vh - 14rem)" }}
          >
            <ManagerListPanel
              managers={managers}
              selectedManagerId={selectedManagerId}
              onSelect={handleManagerSelect}
              isLoading={isLoadingManagers}
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
                staff={staff}
                managers={managers}
                onToggleStatus={handleToggleStatus}
                onEdit={(staffMember) => setStaffToUpdate(staffMember)}
              />
            </div>

            {/* Action buttons footer */}
            {selectedManagerId && !isLoadingStaff && (
              <div className="flex gap-2 justify-end px-4 py-4 border-t border-input bg-muted shrink-0 mt-auto">
                <button
                  onClick={() => setTeamAssignModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  Phân công đội ngũ
                </button>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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

      <UpdateStaffModal
        isOpen={!!staffToUpdate}
        onClose={() => setStaffToUpdate(null)}
        onSubmit={handleUpdateStaff}
        staffData={staffToUpdate}
      />

      {selectedManager && (
        <TeamAssignmentModal
          isOpen={teamAssignModalOpen}
          onClose={() => setTeamAssignModalOpen(false)}
          managerId={selectedManager.managerId}
          managerName={selectedManager.managerName}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
