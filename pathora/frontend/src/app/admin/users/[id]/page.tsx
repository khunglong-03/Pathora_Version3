"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminService } from "@/api/services/adminService";
import type { AdminUserDetail } from "@/api/services/adminService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import Icon from "@/components/ui/Icon";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Admin: { bg: "#FEE2E2", text: "#DC2626" },
  Manager: { bg: "#FEF3C7", text: "#C9873A" },
  TourDesigner: { bg: "#EDE9FE", text: "#7C3AED" },
  TourGuide: { bg: "#DBEAFE", text: "#2563EB" },
  Customer: { bg: "#F3F4F6", text: "#6B7280" },
  Transport: { bg: "#CCFBF1", text: "#0D9488" },
  Hotel: { bg: "#FFEDD5", text: "#EA580C" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id ?? "";

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    const result = await adminService.getUserDetail(userId);

    if (result) {
      setUser(result);
    } else {
      setError("Không tìm thấy người dùng.");
    }
    setIsLoading(false);
  }, [userId, reloadToken]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  if (isLoading) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Chi tiết người dùng" backHref="/admin/users" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Chi tiết người dùng" backHref="/admin/users" />
        <AdminErrorCard message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  if (!user) return null;

  const statusStyle = user.status === "Active"
    ? { bg: "#DCFCE7", dot: "#22C55E", label: "Hoạt động", text: "#166534" }
    : { bg: "#F3F4F6", dot: "#9CA3AF", label: "Khóa", text: "#6B7280" };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Chi tiết người dùng"
        subtitle={user.fullName}
        backHref="/admin/users"
        onRefresh={handleRefresh}
      />

      <div className="max-w-3xl">
        {/* Profile card */}
        <div
          className="rounded-xl border border-[#E5E7EB] bg-white p-6 mb-6"
          style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ backgroundColor: "#C9873A" }}
            >
              {getInitials(user.fullName)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: "#111827" }}>{user.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: statusStyle.bg + "20", color: statusStyle.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
                  {statusStyle.label}
                </span>
                <span className="text-sm" style={{ color: "#6B7280" }}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {user.roles.map((role) => {
              const style = ROLE_COLORS[role] ?? ROLE_COLORS["Customer"];
              return (
                <span
                  key={role}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {role}
                </span>
              );
            })}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow label="Email" value={user.email} icon="EnvelopeSimple" />
            <InfoRow label="Điện thoại" value={user.phone ?? "—"} icon="Phone" />
            <InfoRow label="Ngày tạo" value={formatDate(user.createdAt)} icon="Calendar" />
            <InfoRow label="Đăng nhập cuối" value={formatDate(user.lastLogin)} icon="Clock" />
            {user.address && (
              <InfoRow label="Địa chỉ" value={user.address} icon="MapPin" />
            )}
            {user.nationality && (
              <InfoRow label="Quốc tịch" value={user.nationality} icon="Globe" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: "#F3F4F6" }}
      >
        <Icon icon={icon} className="size-4" style={{ color: "#9CA3AF" }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: "#374151" }}>{value}</p>
      </div>
    </div>
  );
}