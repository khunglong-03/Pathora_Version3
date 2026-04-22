"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminService } from "@/api/services/adminService";
import type { TransportProviderDetail } from "@/types/admin";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
  AdminFilterTabs,
  AdminKpiStrip,
  DriverActivityDrawer,
} from "@/features/dashboard/components";
import { PlusIcon, PencilSimpleIcon, TrashIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import VehicleForm from "@/components/transport/VehicleForm";
import { toast } from "react-toastify";
import type { CreateVehicleDto, UpdateVehicleDto, Vehicle } from "@/api/services/transportProviderService";
import type { DriverSummary } from "@/types/admin";

// Tab type
type TabValue = "overview" | "vehicles" | "drivers" | "bookings";

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "Tổng quan", value: "overview" },
  { label: "Phương tiện", value: "vehicles" },
  { label: "Tài xế", value: "drivers" },
  { label: "Đặt xe", value: "bookings" },
];

export default function TransportProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [entity, setEntity] = useState<TransportProviderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [reloadToken, setReloadToken] = useState(0);

  // Vehicle management state
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState<string | null>(null);

  // Driver activity state
  const [selectedDriverForActivity, setSelectedDriverForActivity] = useState<DriverSummary | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const loadEntity = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getTransportProviderDetail(id);
      if (data) {
        setEntity(data as TransportProviderDetail);
      } else {
        setError("Không tìm thấy nhà cung cấp vận tải.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transport provider");
    } finally {
      setIsLoading(false);
    }
  }, [id, reloadToken]);

  useEffect(() => {
    void loadEntity();
  }, [loadEntity]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const handleViewDriverActivity = (driver: DriverSummary) => {
    setSelectedDriverForActivity(driver);
    setIsActivityDrawerOpen(true);
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleFormOpen(true);
  };

  const handleEditVehicle = (vehicleSummary: any) => {
    // Map VehicleSummary to Vehicle for the form
    const vehicle: Vehicle = {
      ...vehicleSummary,
      createdOnUtc: vehicleSummary.createdAt,
    };
    setEditingVehicle(vehicle);
    setIsVehicleFormOpen(true);
  };

  const handleDeleteVehicle = async (plate: string) => {
    if (!window.confirm(`Xóa phương tiện "${plate}"?`)) return;
    setIsDeletingVehicle(plate);
    try {
      await adminService.deleteAdminTransportVehicle(id, plate);
      toast.success("Xóa phương tiện thành công");
      handleRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setIsDeletingVehicle(null);
    }
  };

  const handleVehicleFormSave = async (data: CreateVehicleDto | UpdateVehicleDto) => {
    try {
      if (editingVehicle) {
        await adminService.updateAdminTransportVehicle(id, editingVehicle.vehiclePlate, data);
        toast.success("Cập nhật phương tiện thành công");
      } else {
        await adminService.createAdminTransportVehicle(id, data as CreateVehicleDto);
        toast.success("Thêm phương tiện thành công");
      }
      setIsVehicleFormOpen(false);
      handleRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Đang tải..." subtitle="" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Chi tiết nhà cung cấp vận tải" backHref="/admin/transport-providers" />
        <AdminErrorCard
          message={error ?? "Không tìm thấy nhà cung cấp"}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  const tabsWithCounts = TABS.map((tab) => ({
    ...tab,
    count:
      tab.value === "overview"
        ? undefined
        : tab.value === "vehicles"
          ? entity.vehicles.length
          : tab.value === "drivers"
            ? entity.drivers.length
            : entity.bookingCount,
  }));

  const kpis = [
    {
      label: "Phương tiện",
      value: entity.vehicles.length.toString(),
      icon: "Van",
      accent: "#0D9488",
    },
    {
      label: "Tài xế",
      value: entity.drivers.length.toString(),
      icon: "User",
      accent: "#6366F1",
    },
    {
      label: "Tổng đặt xe",
      value: entity.bookingCount.toString(),
      icon: "Ticket",
      accent: "#C9873A",
    },
    {
      label: "Hoàn thành",
      value: entity.completedBookingCount.toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeader
        title={entity.supplierName}
        subtitle="Chi tiết nhà cung cấp vận tải"
        backHref="/admin/transport-providers"
        onRefresh={handleRefresh}
      />

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            entity.status === "Active"
              ? "bg-green-100 text-green-800"
              : entity.status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {entity.status === "Active"
            ? "Hoạt động"
            : entity.status === "Pending"
              ? "Đang chờ"
              : "Ngừng hoạt động"}
        </span>
      </div>

      {/* KPI Strip */}
      <div className="mt-4">
        <AdminKpiStrip kpis={kpis} />
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <AdminFilterTabs
          tabs={tabsWithCounts}
          activeValue={activeTab}
          onChange={(v) => setActiveTab(v as TabValue)}
        />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin nhà cung cấp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entity.supplierCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Mã nhà cung cấp</p>
                  <p className="font-medium">{entity.supplierCode}</p>
                </div>
              )}
              {entity.taxCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Mã số thuế</p>
                  <p className="font-medium">{entity.taxCode}</p>
                </div>
              )}
              {entity.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{entity.address}</p>
                </div>
              )}
              {entity.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{entity.email}</p>
                </div>
              )}
              {entity.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Điện thoại</p>
                  <p className="font-medium">{entity.phone}</p>
                </div>
              )}
              {entity.userCreatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(entity.userCreatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}
              {entity.primaryContinent && (
                <div>
                  <p className="text-sm text-muted-foreground">Châu lục chính</p>
                  <p className="font-medium">{entity.primaryContinent}</p>
                </div>
              )}
              {entity.continents && entity.continents.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Khu vực hoạt động</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entity.continents.map((continent) => (
                      <span key={continent} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full font-medium text-gray-700">
                        {continent}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "vehicles" && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 flex justify-end border-b">
              <button
                onClick={handleAddVehicle}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#0D9488" }}
              >
                <PlusIcon size={16} weight="bold" />
                Thêm phương tiện
              </button>
            </div>
            {entity.vehicles.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Chưa có phương tiện nào</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Biển số</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Loại xe</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Số ghế</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Khu vực</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entity.vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-3 font-mono text-sm">{v.vehiclePlate}</td>
                      <td className="px-4 py-3 text-sm">{v.vehicleType}</td>
                      <td className="px-4 py-3 text-sm">{v.seatCapacity}</td>
                      <td className="px-4 py-3 text-sm">{v.locationArea ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {v.isActive ? "Hoạt động" : "Ngừng"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditVehicle(v)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500"
                            title="Sửa"
                          >
                            <PencilSimpleIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.vehiclePlate)}
                            disabled={isDeletingVehicle === v.vehiclePlate}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500 disabled:opacity-50"
                            title="Xóa"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "drivers" && (
          <div className="rounded-xl border bg-card overflow-hidden">
            {entity.drivers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Chưa có tài xế nào</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Họ tên</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">GPLX</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Loại GPLX</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Điện thoại</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entity.drivers.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-sm">{d.fullName}</td>
                      <td className="px-4 py-3 text-sm font-mono">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-sm">{d.licenseType}</td>
                      <td className="px-4 py-3 text-sm">{d.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {d.isActive ? "Hoạt động" : "Ngừng"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewDriverActivity(d)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-orange-50 text-orange-500"
                          title="Xem hoạt động"
                        >
                          <ClockCounterClockwiseIcon size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Danh sách đặt xe sẽ hiển thị khi có dữ liệu
            </p>
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      {isVehicleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsVehicleFormOpen(false)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl" style={{ borderLeft: "1px solid var(--border)" }}>
            <VehicleForm
              vehicle={editingVehicle ?? undefined}
              onSave={handleVehicleFormSave}
              onCancel={() => setIsVehicleFormOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Driver Activity Drawer */}
      <DriverActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        driver={selectedDriverForActivity}
        providerId={id}
      />
    </div>
  );
}
