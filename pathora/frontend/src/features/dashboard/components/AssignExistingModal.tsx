"use client";

import React, { useEffect, useState } from "react";
import { XIcon, UserPlusIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { userService } from "@/api/services/userService";
import { AdminErrorCard } from "@/features/dashboard/components/AdminErrorCard";

// API response shape for user list items with role
interface UserListItem {
  id: string;
  fullName: string | null;
  email: string;
  role?: string;
}

interface AssignExistingModalProps {
  isOpen: boolean;
  onClose: () => void;
  excludedUserIds: string[];
  role: "TourDesigner" | "TourGuide";
  onAssign: (userId: string) => Promise<void>;
}

const ROLE_LABELS: Record<string, string> = {
  TourDesigner: "Tour Designer",
  TourGuide: "Tour Guide",
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AssignExistingModal({
  isOpen,
  onClose,
  excludedUserIds,
  role,
  onAssign,
}: AssignExistingModalProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [filtered, setFiltered] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await userService.getAll(undefined, 1, 100);
      const roleFiltered = (result ?? []).filter(
        (u: UserListItem) =>
          u.role === role &&
          !excludedUserIds.includes(u.id),
      );
      setUsers(roleFiltered as UserListItem[]);
      setFiltered(roleFiltered as UserListItem[]);
      setIsLoading(false);
    };

    void load();
  }, [isOpen, role, excludedUserIds]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        users.filter(
          (u: UserListItem) =>
            (u.fullName ?? "").toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q),
        ),
      );
    }
  }, [search, users]);

  if (!isOpen) return null;

  const handleAssign = async (userId: string) => {
    setAssigningUserId(userId);
    try {
      await onAssign(userId);
      onClose();
    } finally {
      setAssigningUserId(null);
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: role === "TourDesigner" ? "#EDE9FE" : "#DBEAFE" }}
            >
              <UserPlusIcon
                size={18}
                weight="bold"
                style={{ color: role === "TourDesigner" ? "#7C3AED" : "#2563EB" }}
              />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>
                Gán {ROLE_LABELS[role]} hiện có
              </h2>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Chọn nhân viên chưa được gán cho manager này
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6]"
            aria-label="Đóng"
          >
            <XIcon size={18} weight="bold" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9CA3AF" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm transition-all duration-200 focus:outline-none focus:border-[#C9873A] focus:ring-2 focus:ring-amber-500/20"
              style={{ color: "#111827" }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
              Đang tải...
            </div>
          ) : error ? (
            <AdminErrorCard message={error} onRetry={() => {}} />
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
              Không tìm thấy nhân viên nào.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((user: UserListItem) => {
                const isAssigning = assigningUserId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => void handleAssign(user.id)}
                    disabled={isAssigning}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#C9873A] hover:bg-amber-50/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "#C9873A" }}
                    >
                      {getInitials(user.fullName ?? "")}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                        {user.fullName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                        {user.email}
                      </p>
                    </div>
                    {isAssigning && (
                      <span className="text-xs" style={{ color: "#C9873A" }}>
                        Đang gán...
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA]"
            style={{ color: "#374151" }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}