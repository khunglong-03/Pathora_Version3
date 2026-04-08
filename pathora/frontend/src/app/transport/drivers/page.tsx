"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type { Driver, CreateDriverDto, UpdateDriverDto } from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import DriverForm from "@/components/transport/DriverForm";
import { toast } from "react-toastify";

// Backend returns numeric license type, map to label for display
const DRIVER_LICENSE_LABELS: Record<number, string> = {
  1: "Bằng B1",
  2: "Bằng B2",
  3: "Bằng C",
  4: "Bằng D",
  5: "Bằng E",
  6: "Bằng F",
  7: "Khác",
};
function getLicenseDisplay(licenseType: string | undefined): string {
  if (!licenseType) return "-";
  const num = parseInt(licenseType, 10);
  return !isNaN(num) && DRIVER_LICENSE_LABELS[num] ? DRIVER_LICENSE_LABELS[num] : licenseType;
}

type StatusFilter = "all" | "ready" | "driving" | "leave" | "inactive";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  Sẵn sàng: { label: "Sẵn sàng", color: "#22C55E", bg: "#DCFCE7" },
  "Đang lái": { label: "Đang lái", color: "#3B82F6", bg: "#DBEAFE" },
  "Nghỉ phép": { label: "Nghỉ phép", color: "#F59E0B", bg: "#FEF3C7" },
  "Không hoạt động": { label: "Không hoạt động", color: "#EF4444", bg: "#FEE2E2" },
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "ready", label: "Sẵn sàng" },
  { key: "driving", label: "Đang lái" },
  { key: "leave", label: "Nghỉ phép" },
  { key: "inactive", label: "Không hoạt động" },
];

export default function TransportDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transportProviderService.getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tài xế");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  // Note: Backend doesn't have driver status (ready/driving/leave) yet.
  // For now, we treat isActive as the primary status filter.
  // The backend would need to add a Status field to support the full filter.
  const filteredDrivers = drivers.filter((d) => {
    if (filter === "all") return true;
    if (filter === "ready") return d.isActive; // Active drivers = ready (simplified)
    if (filter === "inactive") return !d.isActive;
    // Driving/leave filters show all active for now (backend doesn't have these statuses)
    if (filter === "driving" || filter === "leave") return d.isActive;
    return true;
  });

  const getStatusLabel = (d: Driver): string => {
    return d.isActive ? "Sẵn sàng" : "Không hoạt động";
  };

  const handleAdd = () => {
    setEditingDriver(null);
    setIsFormOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Xóa tài xế này?`)) return;
    setIsDeleting(id);
    try {
      const success = await transportProviderService.deleteDriver(id);
      if (success) {
        toast.success("Xóa tài xế thành công");
        void loadDrivers();
      } else {
        toast.error("Xóa tài xế thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSave = async (data: CreateDriverDto | UpdateDriverDto) => {
    if (editingDriver) {
      const result = await transportProviderService.updateDriver(editingDriver.id, data as UpdateDriverDto);
      if (result) {
        toast.success("Cập nhật tài xế thành công");
        setIsFormOpen(false);
        void loadDrivers();
      } else {
        toast.error("Cập nhật tài xế thất bại. Vui lòng thử lại.");
      }
    } else {
      const result = await transportProviderService.createDriver(data as CreateDriverDto);
      if (result) {
        toast.success("Thêm tài xế thành công");
        setIsFormOpen(false);
        void loadDrivers();
      } else {
        toast.error("Thêm tài xế thất bại. Vui lòng thử lại.");
      }
    }
  };

  const activeCount = drivers.filter((d) => d.isActive).length;

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Quản lý tài xế"
        subtitle={`${drivers.length} tài xế · ${activeCount} đang hoạt động`}
        onRefresh={() => void loadDrivers()}
        actionButtons={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#6366F1" }}
          >
            <Plus size={16} weight="bold" />
            Thêm tài xế
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all"
            ? drivers.length
            : tab.key === "ready"
            ? drivers.filter((d) => d.isActive).length
            : tab.key === "inactive"
            ? drivers.filter((d) => !d.isActive).length
            : drivers.filter((d) => d.isActive).length; // driving/leave show active
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === tab.key ? "text-white" : "border"
              }`}
              style={
                filter === tab.key
                  ? { backgroundColor: "#6366F1" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
              aria-pressed={filter === tab.key}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadDrivers()} />
      )}

      {!error && !isLoading && filteredDrivers.length === 0 && (
        <AdminEmptyState
          icon="UsersThree"
          heading="Chưa có tài xế nào"
          description="Thêm tài xế để bắt đầu quản lý."
          action={
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              <Plus size={16} />
              Thêm tài xế
            </button>
          }
        />
      )}

      {!error && !isLoading && filteredDrivers.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <table className="w-full text-sm" role="table" aria-label="Danh sách tài xế">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Số điện thoại</th>
                <th className="px-4 py-3 font-medium">Bằng lái</th>
                <th className="px-4 py-3 font-medium">Loại bằng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ghi chú</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => {
                const status = getStatusLabel(driver);
                const badge = STATUS_BADGE[status] ?? { label: status, color: "#9CA3AF", bg: "#F3F4F6" };
                return (
                  <tr
                    key={driver.id}
                    className="border-t transition-colors duration-150 hover:bg-gray-50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 font-medium">{driver.fullName}</td>
                    <td className="px-4 py-3">{driver.phoneNumber ?? "-"}</td>
                    <td className="px-4 py-3">{driver.licenseNumber ?? "-"}</td>
                    <td className="px-4 py-3">{getLicenseDisplay(driver.licenseType)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                        role="status"
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                      {driver.notes ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="p-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                          style={{ color: "#6B7280" }}
                          aria-label={`Sửa tài xế ${driver.fullName}`}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          disabled={isDeleting === driver.id}
                          className="p-2 rounded-lg transition-colors duration-150 hover:bg-red-50 disabled:opacity-50"
                          style={{ color: "#EF4444" }}
                          aria-label={`Xóa tài xế ${driver.fullName}`}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Form */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div
            className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl"
            style={{ borderLeft: "1px solid var(--border)" }}
          >
            <DriverForm
              driver={editingDriver ?? undefined}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
