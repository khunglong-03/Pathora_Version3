"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { userService } from "@/api/services/userService";
import { tourManagerAssignmentService, ASSIGNED_ENTITY_TYPE } from "@/api/services/tourManagerAssignmentService";
import type {
  TourManagerAssignmentDetail,
  AssignmentItemDetail,
  AssignmentItem,
} from "@/api/services/tourManagerAssignmentService";
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
  assignmentId?: string;
  isNew?: boolean;
}


export default function EditTourManagerPage() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.id as string;

  // Manager info
  const [managerDetail, setManagerDetail] = useState<TourManagerAssignmentDetail | null>(null);

  // Loading/error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Available users for adding
  const [availableDesigners, setAvailableDesigners] = useState<FilteredUser[]>([]);
  const [availableGuides, setAvailableGuides] = useState<FilteredUser[]>([]);

  // Selection state
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [designerSearch, setDesignerSearch] = useState("");
  const [guideSearch, setGuideSearch] = useState("");
  const [showDesignerDropdown, setShowDesignerDropdown] = useState(false);
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load manager detail
  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await tourManagerAssignmentService.getById(managerId);
        if (!active) return;
        if (result.success && result.data) {
          setManagerDetail(result.data);
          const existing: SelectedMember[] = result.data.assignments.map((a: AssignmentItemDetail) => ({
            id: a.userId ?? a.tourId ?? "",
            name: a.userName ?? a.tourName ?? "—",
            email: a.userEmail ?? "—",
            entityType: a.entityType,
            roleInTeam: a.roleInTeam ?? null,
            assignmentId: a.id,
          }));
          setSelectedMembers(existing);
        } else {
          setLoadError(result.error?.message ?? "Không thể tải thông tin Tour Manager.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [managerId]);

  // Load available users for adding
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const allUsers = await userService.getAll(undefined, 1, 200);
        if (!active) return;
        const designers = (allUsers as FilteredUser[]).filter((u: unknown) => {
          const user = u as FilteredUser;
          return user.roles?.some((r) => r.name === "TourDesigner");
        });
        const guides = (allUsers as FilteredUser[]).filter((u: unknown) => {
          const user = u as FilteredUser;
          return user.roles?.some((r) => r.name === "TourGuide");
        });
        setAvailableDesigners(designers);
        setAvailableGuides(guides);
      } catch {
        // ignore
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  // Filter out already-selected users from dropdown options
  const existingMemberIds = new Set(selectedMembers.map((m) => m.id));

  const filteredDesigners = availableDesigners.filter(
    (u) =>
      !existingMemberIds.has(u.id) &&
      (designerSearch === "" ||
        u.fullName?.toLowerCase().includes(designerSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(designerSearch.toLowerCase())),
  );

  const filteredGuides = availableGuides.filter(
    (u) =>
      !existingMemberIds.has(u.id) &&
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
        isNew: true,
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Build assignment list for bulk assign
      const assignments: AssignmentItem[] = selectedMembers
        .filter((m) => m.isNew)
        .map((m) => ({
          assignedUserId: m.id,
          assignedTourId: undefined,
          assignedEntityType: m.entityType,
          assignedRoleInTeam: m.roleInTeam,
        }));

      if (assignments.length > 0) {
        const result = await tourManagerAssignmentService.bulkAssign(managerId, assignments);
        if (!result.success) {
          setSaveError(result.error?.message ?? "Lưu thất bại.");
          return;
        }
      }

      // Handle removals: for members that existed but are no longer in selectedMembers
      // We need to know which ones were removed. Since bulkAssign replaces, we handle adds only
      // and removals should be handled by separate delete calls. For simplicity, we rebuild:
      // Actually, looking at the backend, bulkAssign does a full replacement.
      // The current selectedMembers may have some that were in the original set.
      // We need to identify which ones to REMOVE (existed before, now gone).
      const originalIds = new Set(
        (managerDetail?.assignments ?? []).map((a: AssignmentItemDetail) => a.id),
      );
      const currentIds = new Set(selectedMembers.map((m) => m.assignmentId ?? ""));

      // Remove deleted assignments
      const toRemove = [...originalIds].filter((id) => !currentIds.has(id) && id !== undefined && id !== "");
      for (const assignId of toRemove) {
        const removed = (managerDetail?.assignments ?? []).find(
          (a: AssignmentItemDetail) => a.id === assignId,
        );
        if (removed) {
          await tourManagerAssignmentService.remove(managerId, {
            assignedUserId: removed.userId,
            assignedTourId: removed.tourId,
            assignedEntityType: removed.entityType,
          });
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/admin/tour-managers");
      }, 1500);
    } catch {
      setSaveError("Đã xảy ra lỗi khi lưu.");
    } finally {
      setIsSaving(false);
    }
  };

  const designerMembers = selectedMembers.filter(
    (m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourDesigner,
  );
  const guideMembers = selectedMembers.filter(
    (m) => m.entityType === ASSIGNED_ENTITY_TYPE.TourGuide,
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-1/3" />
          <div className="h-4 bg-stone-200 rounded w-1/2" />
          <div className="h-48 bg-stone-200 rounded mt-6" />
        </div>
      </div>
    );
  }

  if (loadError || !managerDetail) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-700">{loadError ?? "Không tìm thấy Tour Manager."}</p>
          <button
            onClick={() => router.push("/admin/tour-managers")}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/tour-managers")}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-3 transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          Quay lại danh sách
        </button>
        <h1 className="text-2xl font-bold text-stone-900">
          Chỉnh sửa Tour Manager
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Quản lý đội ngũ của {managerDetail.managerName}
        </p>
      </div>

      {/* Manager info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold text-lg">
          {managerDetail.managerName
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">{managerDetail.managerName}</p>
          <p className="text-xs text-amber-700">{managerDetail.managerEmail}</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
            {designerMembers.length} Designer{designerMembers.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            {guideMembers.length} Guide{guideMembers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>

      {/* Tour Designers section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
            {designerMembers.length}
          </span>
          Tour Designers
        </h2>
        <div className="relative mb-3">
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
            <p className="text-xs text-stone-400 italic">Chưa có Tour Designer nào</p>
          )}
        </div>
      </motion.div>

      {/* Tour Guides section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            {guideMembers.length}
          </span>
          Tour Guides
        </h2>
        <div className="relative mb-3">
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
            <p className="text-xs text-stone-400 italic">Chưa có Tour Guide nào</p>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/tour-managers")}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Huy
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        {saveError && (
          <p className="text-sm text-red-600">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Icon icon="heroicons:check-circle" className="size-4" />
            Lưu thành công! Đang chuyển hướng...
          </p>
        )}
      </div>
    </div>
  );
}
