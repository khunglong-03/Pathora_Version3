"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/api/services/adminService";
import { adminUserService } from "@/api/services/adminUserService";
import type { HotelProviderDetail, HotelAccommodationSummary } from "@/types/admin";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
  AdminFilterTabs,
  AdminKpiStrip,
} from "@/features/dashboard/components";
import { Bed, PhoneIcon, EnvelopeSimpleIcon, MapPinIcon, FileTextIcon, CheckCircleIcon, Prohibit, CheckCircle } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";
import { ContinentChip, ContinentChips } from "@/components/shared/ContinentChip";
import { toast } from "react-toastify";

// Tab type
type TabValue = "overview" | "accommodations" | "bookings";

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "Tổng quan", value: "overview" },
  { label: "Cơ sở lưu trú", value: "accommodations" },
  { label: "Đặt phòng", value: "bookings" },
];

export default function HotelProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [entity, setEntity] = useState<HotelProviderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [reloadToken, setReloadToken] = useState(0);

  const loadEntity = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getHotelProviderDetail(id);
      if (data) {
        setEntity(data as HotelProviderDetail);
      } else {
        setError("Không tìm thấy nhà cung cấp khách sạn.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load hotel provider");
    } finally {
      setIsLoading(false);
    }
  }, [id, reloadToken]);

  useEffect(() => {
    void loadEntity();
  }, [loadEntity]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const handleToggleStatus = async () => {
    if (!entity || !entity.ownerUserId) return;

    const isBanned = entity.userStatus === "Banned";
    const newStatus = isBanned ? "Active" : "Banned";
    
    const confirmMessage = isBanned 
      ? "Bạn có chắc chắn muốn mở khóa tài khoản này?" 
      : "CẢNH BÁO: Khóa tài khoản này sẽ NGỪNG hoạt động tất cả khách sạn và phương tiện thuộc sở hữu của người dùng này. Bạn có chắc chắn muốn tiếp tục?";

    if (!window.confirm(confirmMessage)) return;

    setIsUpdatingStatus(true);
    try {
      const success = await adminUserService.updateUserStatus({
        userId: entity.ownerUserId,
        newStatus: newStatus
      });

      if (success) {
        toast.success(isBanned ? "Đã mở khóa tài khoản thành công" : "Đã khóa tài khoản thành công");
        handleRefresh();
      } else {
        toast.error("Gặp lỗi khi cập nhật trạng thái tài khoản");
      }
    } catch (err) {
      toast.error("Lỗi hệ thống");
    } finally {
      setIsUpdatingStatus(false);
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
        <AdminPageHeader title="Chi tiết nhà cung cấp khách sạn" backHref="/admin/hotels/suppliers" />
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
        : tab.value === "accommodations"
          ? entity.accommodations.length
          : entity.bookingCount,
  }));

  const kpis = [
    {
      label: "Cơ sở lưu trú",
      value: entity.accommodationCount.toString(),
      icon: "Bed",
      accent: "#EA580C",
    },
    {
      label: "Tổng phòng",
      value: entity.totalRooms.toString(),
      icon: "CheckCircleIcon",
      accent: "#0D9488",
    },
    {
      label: "Tổng đặt phòng",
      value: entity.bookingCount.toString(),
      icon: "Ticket",
      accent: "#6366F1",
    },
    {
      label: "Hoàn thành",
      value: entity.completedBookingCount.toString(),
      icon: "CheckCircleIcon",
      accent: "#22C55E",
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Active":
        return "Hoạt động";
      case "Pending":
        return "Đang chờ";
      case "Inactive":
        return "Ngừng";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return { bg: "bg-green-100", text: "text-green-800" };
      case "Pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };

  const shouldShowOperationalContinents =
    entity.continents.length > 0 &&
    !(entity.continents.length === 1 && entity.primaryContinent && entity.continents[0] === entity.primaryContinent);

  return (
    <div className="p-6">
      <AdminPageHeader
        title={entity.supplierName}
        subtitle="Chi tiết nhà cung cấp khách sạn"
        backHref="/admin/hotels/suppliers"
        onRefresh={handleRefresh}
        actionButtons={
          entity.ownerUserId ? (
            <button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-white transition-all duration-200 ${
                entity.userStatus === "Banned" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-red-600 hover:bg-red-700"
              } disabled:opacity-50`}
            >
              {entity.userStatus === "Banned" ? (
                <>
                  <CheckCircle size={18} weight="bold" />
                  Mở khóa tài khoản
                </>
              ) : (
                <>
                  <Prohibit size={18} weight="bold" />
                  Khóa tài khoản
                </>
              )}
            </button>
          ) : null
        }
      />

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(entity.status).bg} ${getStatusColor(entity.status).text}`}
        >
          {getStatusLabel(entity.status)}
        </span>
        {entity.userStatus === "Banned" && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold bg-red-100 text-red-800 border border-red-200">
            <Prohibit size={14} className="mr-1" /> Tài khoản bị khóa
          </span>
        )}
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
              {entity.createdOnUtc && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(entity.createdOnUtc).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}
              {entity.primaryContinent && (
                <div>
                  <p className="text-sm text-muted-foreground">Khu vực chính</p>
                  <div className="mt-2">
                    <ContinentChip continent={entity.primaryContinent} />
                  </div>
                </div>
              )}
              {shouldShowOperationalContinents && (
                <div>
                  <p className="text-sm text-muted-foreground">Phạm vi hoạt động</p>
                  <div className="mt-2">
                    <ContinentChips continents={entity.continents} />
                  </div>
                </div>
              )}
              {entity.supplierName && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Tên khách sạn</p>
                  <p className="font-medium">{entity.supplierName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Số cơ sở</p>
                <p className="font-medium">{entity.propertyCount}</p>
              </div>
            </div>

            {/* Active vs Completed */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#6366F1" }}>{entity.bookingCount}</p>
                <p className="text-sm text-muted-foreground">Tổng đặt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#22C55E" }}>{entity.completedBookingCount}</p>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#EA580C" }}>{entity.activeBookingCount}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "accommodations" && (
          <div className="rounded-xl border bg-card overflow-hidden">
            {entity.properties.length > 0 && (
              <div className="grid gap-4 border-b p-6 md:grid-cols-2">
                {entity.properties.map((property) => (
                  <div key={property.id} className="rounded-xl border p-4">
                    <div className="font-semibold">{property.supplierName}</div>
                    <div className="text-sm text-muted-foreground">{property.supplierCode}</div>
                    <div className="mt-2 text-sm">{property.address ?? "Không có địa chỉ"}</div>
                    <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                      <span>{property.accommodationCount} loại phòng</span>
                      <span>{property.totalRooms} phòng</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {entity.accommodations.length === 0 ? (
              <div className="p-12 text-center">
                <Bed size={40} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Chưa có cơ sở lưu trú nào</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tên / Loại phòng</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Khu vực</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Số phòng</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entity.accommodations.map((acc) => (
                    <tr key={acc.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bed size={16} className="text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{acc.supplierName}</p>
                            <p className="text-sm font-medium">{acc.roomType}</p>
                            {acc.name && (
                              <p className="text-xs text-muted-foreground">{acc.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{acc.locationArea ?? "-"}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{acc.totalRooms}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{acc.id.slice(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="rounded-xl border bg-card p-12 text-center">
            <CheckCircleIcon size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Tổng {entity.bookingCount} đặt phòng — {entity.activeBookingCount} đang hoạt động, {entity.completedBookingCount} hoàn thành
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Danh sách chi tiết đặt phòng sẽ hiển thị khi có dữ liệu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
