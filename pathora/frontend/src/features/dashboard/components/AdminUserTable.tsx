"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DotsThreeVerticalIcon, EyeIcon, ShieldSlashIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { userService } from "@/api/services/userService";
import type { AdminUserListItem } from "@/api/services/adminService";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Admin: { bg: "#FEE2E2", text: "#DC2626" },
  Manager: { bg: "#FEF3C7", text: "#C9873A" },
  TourOperator: { bg: "#EDE9FE", text: "#7C3AED" },
  TourGuide: { bg: "#DBEAFE", text: "#2563EB" },
  Customer: { bg: "#F3F4F6", text: "#6B7280" },
  TransportProvider: { bg: "#CCFBF1", text: "#0D9488" },
  HotelServiceProvider: { bg: "#FFEDD5", text: "#EA580C" },
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDisplayRole(user: AdminUserListItem): string {
  if (user.roles.length > 0) return user.roles[0];
  if (user.role) return user.role;
  return "—";
}

function getRoleStyle(user: AdminUserListItem) {
  const role = getDisplayRole(user);
  return ROLE_COLORS[role] ?? ROLE_COLORS["Customer"];
}

interface AdminUserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onStatusChange?: () => void;
}

export function AdminUserTable({
  users,
  isLoading,
  currentPage = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  onStatusChange,
}: AdminUserTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown]);

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  if (isLoading) {
    return <SkeletonTable rows={8} columns={5} />;
  }

  if (!users.length) {
    return null;
  }

  return (
    <div>
      <div className="rounded-xl border border-[#E5E7EB] bg-white pb-2">
        {/* Table header */}
        <div
          className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#F3F4F6] rounded-t-xl"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF", width: "80px" }}>Avatar</span>
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Họ tên</span>
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Email</span>
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Vai trò</span>
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Trạng thái</span>
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF", width: "48px" }}>Hành động</span>
        </div>

        {/* Table rows */}
        {users.map((user, index) => {
          const roleStyle = getRoleStyle(user);
          const isActive = user.status === "Active";
          const displayRole = getDisplayRole(user);

          return (
            <div
              key={user.id}
              className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFAFA] transition-all duration-200 cursor-pointer ${openDropdown === user.id ? "relative z-50" : ""}`}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: "#C9873A", width: "80px" }}
              >
                <span style={{ color: "#FFFFFF" }}>{getInitials(user.fullName ?? user.username)}</span>
              </div>

              {/* Full Name */}
              <span
                className="text-sm font-medium truncate"
                style={{ color: "#111827" }}
              >
                {user.fullName ?? user.username}
              </span>

              {/* Email */}
              <span
                className="text-sm truncate"
                style={{ color: "#6B7280" }}
              >
                {user.email}
              </span>

              {/* Role badge */}
              <span
                className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: roleStyle.bg,
                  color: roleStyle.text,
                  minWidth: "80px",
                }}
              >
                {displayRole}
              </span>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span
                  data-testid={`status-dot-${user.id}`}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }}
                />
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {isActive ? "Hoạt động" : "Khóa"}
                </span>
              </div>

              {/* Actions */}
              <div className="relative" style={{ width: "48px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === user.id ? null : user.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[#F3F4F6]"
                  aria-label="Actions"
                >
                  <DotsThreeVerticalIcon size={16} weight="bold" style={{ color: "#6B7280" }} />
                </button>

                {openDropdown === user.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-10 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1 min-w-[180px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#FAFAFA] transition-colors"
                      style={{ color: "#374151" }}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <EyeIcon size={14} weight="bold" />
                      Xem chi tiết
                    </Link>

                    {displayRole !== "Admin" && (
                      <button
                        disabled={togglingId === user.id}
                        onClick={async () => {
                          setTogglingId(user.id);
                          try {
                            const newStatus = user.status === "Active" ? "Inactive" : "Active";
                            await userService.updateStatus({
                              userId: user.id,
                              newStatus,
                            });
                            onStatusChange?.();
                          } catch {
                            // error silently — table still shows current status
                          } finally {
                            setTogglingId(null);
                            setOpenDropdown(null);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                        style={{ color: user.status === "Active" ? "#DC2626" : "#059669" }}
                      >
                        {user.status === "Active" ? (
                          <>
                            <ShieldSlashIcon size={14} weight="bold" />
                            Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon size={14} weight="bold" />
                            Mở khóa tài khoản
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm" style={{ color: "#6B7280" }}>
            Hiển thị {((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, total)} trong {total} người dùng
          </span>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
