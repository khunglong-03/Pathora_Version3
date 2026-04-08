"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  Car,
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import VehicleForm from "@/components/transport/VehicleForm";
import { toast } from "react-toastify";

// Backend returns numeric VehicleType (1=Car, 2=Bus, 3=Minibus, 4=Van, 5=Coach, 6=Motorbike)
const VEHICLE_TYPE_LABELS: Record<number, string> = {
  1: "Xe 4 chỗ",
  2: "Xe buýt",
  3: "Xe 12-29 chỗ",
  4: "Xe van",
  5: "Xe coach",
  6: "Xe máy",
};

function getVehicleTypeLabel(type: string | undefined): string {
  if (!type) return "-";
  const num = parseInt(type, 10);
  return !isNaN(num) && VEHICLE_TYPE_LABELS[num] ? VEHICLE_TYPE_LABELS[num] : type;
}

type StatusFilter = "all" | "active" | "maintenance" | "inactive";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  "Hoạt động": { label: "Hoạt động", color: "#22C55E", bg: "#DCFCE7" },
  "Bảo trì": { label: "Bảo trì", color: "#F59E0B", bg: "#FEF3C7" },
  "Ngưng hoạt động": { label: "Ngưng hoạt động", color: "#EF4444", bg: "#FEE2E2" },
};

export default function TransportVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transportProviderService.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách xe");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const getStatusLabel = (v: Vehicle): string => {
    return v.isActive ? "Hoạt động" : "Ngưng hoạt động";
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === "all") return true;
    if (filter === "active") return v.isActive;
    if (filter === "maintenance") return false; // Backend doesn't have maintenance status yet
    if (filter === "inactive") return !v.isActive;
    return true;
  });

  const handleAdd = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = async (plate: string) => {
    if (!window.confirm(`Xóa xe "${plate}"?`)) return;
    setIsDeleting(plate);
    try {
      const success = await transportProviderService.deleteVehicle(plate);
      if (success) {
        toast.success("Xóa xe thành công");
        void loadVehicles();
      } else {
        toast.error("Xóa xe thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSave = async (data: CreateVehicleDto | UpdateVehicleDto) => {
    if (editingVehicle) {
      const result = await transportProviderService.updateVehicle(editingVehicle.vehiclePlate, data as UpdateVehicleDto);
      if (result) {
        toast.success("Cập nhật xe thành công");
        setIsFormOpen(false);
        void loadVehicles();
      } else {
        toast.error("Cập nhật xe thất bại. Vui lòng thử lại.");
      }
    } else {
      const result = await transportProviderService.createVehicle(data as CreateVehicleDto);
      if (result) {
        toast.success("Thêm xe thành công");
        setIsFormOpen(false);
        void loadVehicles();
      } else {
        toast.error("Thêm xe thất bại. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Quản lý xe"
        subtitle={`${vehicles.length} phương tiện`}
        onRefresh={() => void loadVehicles()}
        actionButtons={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#6366F1" }}
          >
            <Plus size={16} weight="bold" />
            Thêm xe
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "active", "maintenance", "inactive"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              filter === f
                ? "text-white"
                : "border"
            }`}
            style={
              filter === f
                ? { backgroundColor: "#6366F1" }
                : { borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
            aria-pressed={filter === f}
          >
            {f === "all" ? "Tất cả" : f === "active" ? "Hoạt động" : f === "maintenance" ? "Bảo trì" : "Ngưng hoạt động"}
            {f !== "all" && (
              <span
                className="ml-1.5 text-xs opacity-75"
              >
                ({f === "active"
                  ? vehicles.filter((v) => v.isActive).length
                  : vehicles.filter((v) => !v.isActive).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadVehicles()} />
      )}

      {!error && !isLoading && filteredVehicles.length === 0 && (
        <AdminEmptyState
          icon="Car"
          heading="Chưa có phương tiện nào"
          description="Thêm phương tiện để bắt đầu quản lý đội xe."
          action={
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              <Plus size={16} />
              Thêm xe
            </button>
          }
        />
      )}

      {!error && !isLoading && filteredVehicles.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <table className="w-full text-sm" role="table" aria-label="Danh sách phương tiện">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Biển số</th>
                <th className="px-4 py-3 font-medium">Loại xe</th>
                <th className="px-4 py-3 font-medium">Sức chứa</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ghi chú</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const status = getStatusLabel(vehicle);
                const badge = STATUS_BADGE[status] ?? { label: status, color: "#9CA3AF", bg: "#F3F4F6" };
                return (
                  <tr
                    key={vehicle.id}
                    className="border-t transition-colors duration-150 hover:bg-gray-50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 font-mono font-semibold">{vehicle.vehiclePlate}</td>
                    <td className="px-4 py-3">{getVehicleTypeLabel(vehicle.vehicleType)}</td>
                    <td className="px-4 py-3">{vehicle.seatCapacity ? `${vehicle.seatCapacity} người` : "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                        role="status"
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                      {vehicle.notes ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                          style={{ color: "#6B7280" }}
                          aria-label={`Sửa xe ${vehicle.vehiclePlate}`}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.vehiclePlate)}
                          disabled={isDeleting === vehicle.vehiclePlate}
                          className="p-2 rounded-lg transition-colors duration-150 hover:bg-red-50 disabled:opacity-50"
                          style={{ color: "#EF4444" }}
                          aria-label={`Xóa xe ${vehicle.vehiclePlate}`}
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

      {/* Slide-over / Modal Form */}
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
            <VehicleForm
              vehicle={editingVehicle ?? undefined}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
