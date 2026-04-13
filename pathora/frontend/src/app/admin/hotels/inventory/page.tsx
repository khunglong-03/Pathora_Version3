"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminHotelService, type RoomInventoryItem, type PaginatedHotelList } from "@/api/services/adminHotelService";
import {
  AdminPageHeaderIcon,
  AdminKpiStripIcon,
  AdminFilterTabsIcon,
  AdminEmptyStateIcon,
  AdminErrorCardIcon,
} from "@/features/dashboard/components";
import TextInput from "@/components/ui/TextInput";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Bed, CalendarIcon } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";

type DateFilter = "all" | "today" | "this_week" | "this_month";

const DATE_TABS: Array<{ label: string; value: DateFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "this_week" },
  { label: "Tháng này", value: "this_month" },
];

function getDateRange(filter: DateFilter): { from?: string; to?: string } {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  switch (filter) {
    case "today":
      return { from: todayStr, to: todayStr };
    case "this_week": {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        from: startOfWeek.toISOString().split("T")[0],
        to: endOfWeek.toISOString().split("T")[0],
      };
    }
    case "this_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        from: startOfMonth.toISOString().split("T")[0],
        to: endOfMonth.toISOString().split("T")[0],
      };
    }
    default:
      return {};
  }
}

export default function HotelInventoryPage() {
  const [inventory, setInventory] = useState<RoomInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const dateRange = getDateRange(dateFilter);
    const params = {
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      ...dateRange,
    };

    try {
      const result = await adminHotelService.getRoomInventory(params);
      if (result) {
        setInventory(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setInventory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
      setInventory([]);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearch, dateFilter]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const totalRooms = inventory.reduce((sum, item) => sum + item.totalRooms, 0);
  const totalAvailable = inventory.reduce((sum, item) => sum + item.availableRooms, 0);
  const totalBlocked = inventory.reduce((sum, item) => sum + item.blockedRooms, 0);

  const kpis = [
    {
      label: "Tổng phòng",
      value: totalRooms.toString(),
      icon: "Bed",
      accent: "#EA580C",
    },
    {
      label: "Còn trống",
      value: totalAvailable.toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
    {
      label: "Đã chặn",
      value: totalBlocked.toString(),
      icon: "Warning",
      accent: "#EF4444",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeaderIcon
        title="Tồn kho Phòng Khách sạn"
        subtitle="Quản lý số lượng phòng khả dụng theo ngày"
        onRefresh={handleRefresh}
      />

      {/* KPI Strip */}
      <AdminKpiStripIcon kpis={kpis} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <AdminFilterTabsIcon
          tabs={DATE_TABS}
          activeValue={dateFilter}
          onChange={(v) => { setDateFilter(v as DateFilter); setCurrentPage(1); }}
        />
        <div className="w-full md:w-72">
          <TextInput
            type="text"
            placeholder="Tìm khách sạn, loại phòng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon="MagnifyingGlass"
            hasicon={false}
          />
        </div>
      </div>

      {/* Content */}
      {error && <AdminErrorCardIcon message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && inventory.length === 0 && (
        <AdminEmptyStateIcon
          icon="Bed"
          heading="Không có dữ liệu tồn kho"
          description="Không tìm thấy dữ liệu phòng trong khoảng thời gian đã chọn."
        />
      )}

      {!error && !isLoading && inventory.length > 0 && (
        <>
          <div className="rounded-xl border bg-white overflow-hidden" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Khách sạn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loại phòng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Ngày</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Tổng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Khả dụng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Đã chặn</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="transition-colors duration-150 hover:bg-stone-50"
                    style={{ borderBottom: idx < inventory.length - 1 ? "1px solid #F3F4F6" : undefined }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "#FFEDD5" }}
                        >
                          <Bed size={18} weight="fill" style={{ color: "#EA580C" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#111827" }}>
                            {item.supplierName ?? item.accommodationName ?? "—"}
                          </p>
                          {item.accommodationName && item.supplierName && item.supplierName !== item.accommodationName && (
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.accommodationName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: "#374151" }}>{item.roomType}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CalendarIcon size={14} style={{ color: "#9CA3AF" }} />
                        <span className="text-sm" style={{ color: "#374151" }}>{formatDate(item.date)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-semibold" style={{ color: "#111827" }}>{item.totalRooms}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold"
                        style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                      >
                        {item.availableRooms}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {item.blockedRooms > 0 ? (
                        <span
                          className="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold"
                          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                        >
                          {item.blockedRooms}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: "#D1D5DB" }}>0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="rounded-xl border bg-white p-5" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
          <SkeletonTable rows={8} columns={6} />
        </div>
      )}
    </div>
  );
}
