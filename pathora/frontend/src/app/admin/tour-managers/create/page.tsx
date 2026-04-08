"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { userService } from "@/api/services/userService";
import { tourManagerAssignmentService, ASSIGNED_ENTITY_TYPE } from "@/api/services/tourManagerAssignmentService";
import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { UserInfo } from "@/store/domain/auth";

type FilteredUser = UserInfo & {
  roleIds?: number[];
};

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  entityType: number;
  roleInTeam: number | null;
}

interface CreateManagerRequest {
  email: string;
  fullName: string;
  roleIds: number[];
  departments: never[];
  avatar: string;
}

const MANAGER_ROLE_ID = 2;

export default function CreateTourManagerPage() {
  const router = useRouter();

  // Manager account fields
  const [managerEmail, setManagerEmail] = useState("");
  const [managerFullName, setManagerFullName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [createdManagerId, setCreatedManagerId] = useState<string | null>(null);

  // Available users
  const [availableDesigners, setAvailableDesigners] = useState<FilteredUser[]>([]);
  const [availableGuides, setAvailableGuides] = useState<FilteredUser[]>([]);

  // Selection
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [designerSearch, setDesignerSearch] = useState("");
  const [guideSearch, setGuideSearch] = useState("");
  const [showDesignerDropdown, setShowDesignerDropdown] = useState(false);
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);

  // Assignment state
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Load available users
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const allUsers = await userService.getAll(undefined, 1, 200);
        if (!active) return;
        setAvailableDesigners(
          (allUsers as FilteredUser[]).filter((u: unknown) => {
            const user = u as FilteredUser;
            return user.roles?.some((r) => r.name === "TourDesigner");
          }),
        );
        setAvailableGuides(
          (allUsers as FilteredUser[]).filter((u: unknown) => {
            const user = u as FilteredUser;
            return user.roles?.some((r) => r.name === "TourGuide");
          }),
        );
      } catch {
        // ignore
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const filteredDesigners = availableDesigners.filter(
    (u) =>
      !selectedMembers.some((m) => m.id === u.id) &&
      (designerSearch === "" ||
        u.fullName?.toLowerCase().includes(designerSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(designerSearch.toLowerCase())),
  );

  const filteredGuides = availableGuides.filter(
    (u) =>
      !selectedMembers.some((m) => m.id === u.id) &&
      (guideSearch === "" ||
        u.fullName?.toLowerCase().includes(guideSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(guideSearch.toLowerCase())),
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
    if (entityType === ASSIGNED_ENTITY_TYPE.TourDesigner) {
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerEmail.trim() || !managerFullName.trim()) {
      setAccountError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setIsCreatingAccount(true);
    setAccountError(null);
    try {
      const payload: CreateManagerRequest = {
        email: managerEmail.trim(),
        fullName: managerFullName.trim(),
        roleIds: [MANAGER_ROLE_ID],
        departments: [],
        avatar: "",
      };
      const response = await api.post(API_ENDPOINTS.USER.GET_ALL, payload);
      // Extract created user ID from response
      const data = response.data as { result?: { data?: string } };
      const createdId = data.result?.data;
      if (createdId) {
        setCreatedManagerId(createdId);
      }
      setCreatedManagerId(managerEmail); // fallback: use email as identifier
    } catch {
      setAccountError("Không thể tạo tài khoản. Email có thể đã tồn tại.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleAssign = async () => {
    if (!createdManagerId && !managerEmail) {
      setAssignError("Vui lòng tạo tài khoản Tour Manager trước.");
      return;
    }
    if (selectedMembers.length === 0) {
      setAssignError("Vui lòng chọn ít nhất một Tour Designer hoặc Tour Guide.");
      return;
    }
    setIsAssigning(true);
    setAssignError(null);
    try {
      const managerId = createdManagerId ?? managerEmail;
      const payload = {
        tourManagerUserId: managerId,
        assignments: selectedMembers.map((m) => ({
          assignedUserId: m.id,
          assignedTourId: null,
          assignedEntityType: m.entityType,
          assignedRoleInTeam: m.roleInTeam,
        })),
      };
      const result = await tourManagerAssignmentService.assign(payload);
      if (result.success) {
        setAssignSuccess(true);
        setTimeout(() => {
          router.push("/admin/tour-managers");
        }, 1500);
      } else {
        setAssignError(result.error?.message ?? "Phân công thất bại.");
      }
    } catch {
      setAssignError("Đã xảy ra lỗi khi phân công.");
    } finally {
      setIsAssigning(false);
    }
  };

  const designerMembers = selectedMembers.filter((m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourDesigner);
  const guideMembers = selectedMembers.filter((m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourGuide);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Thêm Tour Manager
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Tạo tài khoản Tour Manager và phân công đội ngũ
        </p>
      </div>

      {/* Section 1: Create Manager Account */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-stone-800 mb-4">
          1. Tạo tài khoản Tour Manager
        </h2>
        <form onSubmit={handleCreateAccount} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="manager@example.com"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-stone-600">Họ và tên</label>
            <input
              type="text"
              value={managerFullName}
              onChange={(e) => setManagerFullName(e.target.value)}
              placeholder="Nguyễn Văn B"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isCreatingAccount}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {isCreatingAccount ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>
        {accountError && (
          <p className="mt-3 text-sm text-red-600">{accountError}</p>
        )}
        {createdManagerId && (
          <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
            <Icon icon="heroicons:check-circle" className="size-4" />
            Tài khoản đã được tạo. Bây giờ phân công đội ngũ.
          </p>
        )}
      </motion.div>

      {/* Section 2: Assignment */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-stone-800 mb-4">
          2. Phân công đội ngũ
        </h2>

        {/* Tour Designers */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
              {designerMembers.length}
            </span>
            Tour Designers
          </h3>
          <div className="relative mb-2">
            <div className="relative">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="text"
                value={designerSearch}
                onChange={(e) => {
                  setDesignerSearch(e.target.value);
                  setShowDesignerDropdown(true);
                }}
                onFocus={() => setShowDesignerDropdown(true)}
                placeholder="Tìm kiếm Tour Designer..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {showDesignerDropdown && filteredDesigners.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredDesigners.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addMember(user, ASSIGNED_ENTITY_TYPE.TourDesigner)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-medium text-stone-900">{user.fullName ?? "—"}</span>
                    <span className="ml-2 text-stone-400 text-xs">{user.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {designerMembers.map((m) => (
              <div
                key={m.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium"
              >
                <select
                  value={m.roleInTeam ?? ""}
                  onChange={(e) => updateRoleInTeam(m.id, e.target.value ? Number(e.target.value) : null)}
                  className="bg-transparent text-xs border-none outline-none cursor-pointer"
                >
                  <option value="">Vai trò...</option>
                  <option value="1">Trưởng nhóm</option>
                  <option value="2">Thành viên</option>
                </select>
                {m.name}
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="hover:text-red-600 transition-colors"
                >
                  <Icon icon="heroicons:x" className="size-3" />
                </button>
              </div>
            ))}
            {designerMembers.length === 0 && (
              <p className="text-xs text-stone-400 italic">Chưa chọn Tour Designer nào</p>
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
          <div className="relative mb-2">
            <div className="relative">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="text"
                value={guideSearch}
                onChange={(e) => {
                  setGuideSearch(e.target.value);
                  setShowGuideDropdown(true);
                }}
                onFocus={() => setShowGuideDropdown(true)}
                placeholder="Tìm kiếm Tour Guide..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {showGuideDropdown && filteredGuides.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredGuides.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addMember(user, ASSIGNED_ENTITY_TYPE.TourGuide)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors"
                  >
                    <span className="font-medium text-stone-900">{user.fullName ?? "—"}</span>
                    <span className="ml-2 text-stone-400 text-xs">{user.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {guideMembers.map((m) => (
              <div
                key={m.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
              >
                <select
                  value={m.roleInTeam ?? ""}
                  onChange={(e) => updateRoleInTeam(m.id, e.target.value ? Number(e.target.value) : null)}
                  className="bg-transparent text-xs border-none outline-none cursor-pointer"
                >
                  <option value="">Vai trò...</option>
                  <option value="1">Trưởng nhóm</option>
                  <option value="2">Thành viên</option>
                </select>
                {m.name}
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="hover:text-red-600 transition-colors"
                >
                  <Icon icon="heroicons:x" className="size-3" />
                </button>
              </div>
            ))}
            {guideMembers.length === 0 && (
              <p className="text-xs text-stone-400 italic">Chưa chọn Tour Guide nào</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/tour-managers")}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={handleAssign}
          disabled={isAssigning || selectedMembers.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {isAssigning ? "Đang phân công..." : "Phân công đội ngũ"}
        </button>
        {assignError && (
          <p className="text-sm text-red-600">{assignError}</p>
        )}
        {assignSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Icon icon="heroicons:check-circle" className="size-4" />
            Phân công thành công! Đang chuyển hướng...
          </p>
        )}
      </div>
    </div>
  );
}
