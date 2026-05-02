"use client";

import React, { useEffect, useState } from "react";
import { XIcon, UsersThreeIcon, MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { userService } from "@/api/services/userService";
import { tourManagerAssignmentService, ASSIGNED_ENTITY_TYPE, type AssignmentItem } from "@/api/services/tourManagerAssignmentService";
import type { UserInfo } from "@/store/domain/auth";

type FilteredUser = UserInfo & {
  roleIds?: number[];
  role?: string;
};

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  entityType: number;
  roleInTeam: number | null;
}

interface TeamAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  managerName: string;
  onSuccess: () => void;
}

export function TeamAssignmentModal({
  isOpen,
  onClose,
  managerId,
  managerName,
  onSuccess,
}: TeamAssignmentModalProps) {
  const [availableDesigners, setAvailableDesigners] = useState<FilteredUser[]>([]);
  const [availableGuides, setAvailableGuides] = useState<FilteredUser[]>([]);

  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [designerSearch, setDesignerSearch] = useState("");
  const [guideSearch, setGuideSearch] = useState("");
  const [showDesignerDropdown, setShowDesignerDropdown] = useState(false);
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load available users and current assignments
  useEffect(() => {
    if (!isOpen || !managerId) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        // Load all users to pick from
        const allUsers = await userService.getAll(undefined, 1, 200);
        if (!active) return;
        
        // Ensure allUsers is an array
        const usersArray = Array.isArray(allUsers) ? allUsers : [];
        
        setAvailableDesigners(
          (usersArray as unknown as FilteredUser[]).filter((u) => u.roles?.some((r) => r.name === "TourOperator") || u.role === "TourOperator")
        );
        setAvailableGuides(
          (usersArray as unknown as FilteredUser[]).filter((u) => u.roles?.some((r) => r.name === "TourGuide") || u.role === "TourGuide")
        );

        // Load existing assignments
        const detailResult = await tourManagerAssignmentService.getById(managerId);
        if (!active) return;
        if (detailResult.success && detailResult.data) {
           const existingMembers: SelectedMember[] = detailResult.data.assignments.map(a => ({
             id: a.userId ?? "",
             name: a.userName ?? "—",
             email: a.userEmail ?? "—",
             entityType: a.entityType,
             roleInTeam: a.roleInTeam ?? null,
           })).filter(m => m.id !== "");
           setSelectedMembers(existingMembers);
        }
      } catch (err) {
        setAssignError("Lỗi khi tải dữ liệu.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    
    void load();
    return () => { active = false; };
  }, [isOpen, managerId]);

  const filteredDesigners = availableDesigners.filter(
    (u) =>
      !selectedMembers.some((m) => m.id === u.id) &&
      (designerSearch === "" ||
        (u.fullName ?? "").toLowerCase().includes(designerSearch.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(designerSearch.toLowerCase())),
  );

  const filteredGuides = availableGuides.filter(
    (u) =>
      !selectedMembers.some((m) => m.id === u.id) &&
      (guideSearch === "" ||
        (u.fullName ?? "").toLowerCase().includes(guideSearch.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(guideSearch.toLowerCase())),
  );

  const addMember = (user: FilteredUser, entityType: number) => {
    setSelectedMembers((prev) => [
      ...prev,
      {
        id: user.id,
        name: user.fullName ?? user.username ?? "—",
        email: user.email ?? "—",
        entityType,
        roleInTeam: null,
      },
    ]);
    if (entityType === ASSIGNED_ENTITY_TYPE.TourOperator) {
      setDesignerSearch("");
      setShowDesignerDropdown(false);
    } else {
      setGuideSearch("");
      setShowGuideDropdown(false);
    }
  };

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateRoleInTeam = (id: string, role: number | null) => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, roleInTeam: role } : m)),
    );
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    setAssignError(null);
    try {
      const payload = {
        tourManagerUserId: managerId,
        assignments: selectedMembers.map((m) => ({
          assignedUserId: m.id,
          assignedTourId: undefined,
          assignedEntityType: m.entityType,
          assignedRoleInTeam: m.roleInTeam,
        } as AssignmentItem)),
      };
      const result = await tourManagerAssignmentService.assign(payload);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setAssignError(result.error?.message ?? "Phân công thất bại.");
      }
    } catch {
      setAssignError("Đã xảy ra lỗi khi phân công.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  const designerMembers = selectedMembers.filter((m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourOperator);
  const guideMembers = selectedMembers.filter((m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourGuide);

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
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white shadow-xl flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
              <UsersThreeIcon size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Phân công đội ngũ
              </h2>
              <p className="text-xs text-stone-500">
                Quản lý nhân viên cho {managerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-stone-100"
            aria-label="Đóng"
          >
            <XIcon size={18} weight="bold" className="text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-stone-500">Đang tải dữ liệu...</div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Tour Operators */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                    {designerMembers.length}
                  </span>
                  Tour Operators
                </h3>
                
                {/* Designer Dropdown search */}
                <div className="relative mb-2">
                  <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={designerSearch}
                    onChange={(e) => {
                      setDesignerSearch(e.target.value);
                      setShowDesignerDropdown(true);
                    }}
                    onFocus={() => setShowDesignerDropdown(true)}
                    placeholder="Thêm Tour Operator..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {showDesignerDropdown && filteredDesigners.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredDesigners.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addMember(user, ASSIGNED_ENTITY_TYPE.TourOperator)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium text-stone-900">{user.fullName ?? user.username ?? "—"}</span>
                          <span className="ml-2 text-stone-400 text-xs truncate max-w-[150px]">{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Designer Selected list */}
                <div className="flex flex-wrap gap-2">
                  {designerMembers.map((m) => (
                    <div
                      key={m.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium"
                    >
                      <select
                        value={m.roleInTeam ?? ""}
                        onChange={(e) => updateRoleInTeam(m.id, e.target.value ? Number(e.target.value) : null)}
                        className="bg-transparent text-xs border-none outline-none cursor-pointer text-purple-900"
                      >
                        <option value="">Vai trò...</option>
                        <option value="1">Trưởng nhóm</option>
                        <option value="2">Thành viên</option>
                      </select>
                      {m.name}
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="hover:text-red-600 transition-colors ml-1"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                  {designerMembers.length === 0 && (
                    <p className="text-xs text-stone-400 italic mt-1">Chưa chọn Tour Operator nào</p>
                  )}
                </div>
              </div>

              {/* Tour Guides */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    {guideMembers.length}
                  </span>
                  Tour Guides
                </h3>
                
                {/* Guide Dropdown search */}
                <div className="relative mb-2">
                  <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => {
                      setGuideSearch(e.target.value);
                      setShowGuideDropdown(true);
                    }}
                    onFocus={() => setShowGuideDropdown(true)}
                    placeholder="Thêm Tour Guide..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {showGuideDropdown && filteredGuides.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredGuides.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addMember(user, ASSIGNED_ENTITY_TYPE.TourGuide)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium text-stone-900">{user.fullName ?? user.username ?? "—"}</span>
                          <span className="ml-2 text-stone-400 text-xs truncate max-w-[150px]">{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guide Selected list */}
                <div className="flex flex-wrap gap-2">
                  {guideMembers.map((m) => (
                    <div
                      key={m.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
                    >
                      <select
                        value={m.roleInTeam ?? ""}
                        onChange={(e) => updateRoleInTeam(m.id, e.target.value ? Number(e.target.value) : null)}
                        className="bg-transparent text-xs border-none outline-none cursor-pointer text-blue-900"
                      >
                        <option value="">Vai trò...</option>
                        <option value="1">Trưởng nhóm</option>
                        <option value="2">Thành viên</option>
                      </select>
                      {m.name}
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="hover:text-red-600 transition-colors ml-1"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                  {guideMembers.length === 0 && (
                    <p className="text-xs text-stone-400 italic mt-1">Chưa chọn Tour Guide nào</p>
                  )}
                </div>
              </div>

            </div>
          )}
          {assignError && (
            <p className="mt-4 text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">{assignError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] shrink-0 flex items-center justify-end gap-3 bg-stone-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50"
          >
            Hủy
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning || isLoading}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {isAssigning ? "Đang lưu..." : "Lưu phân công"}
          </button>
        </div>
      </div>
    </div>
  );
}
