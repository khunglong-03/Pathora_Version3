"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminService } from "@/api/services/adminService";
import type { AdminUserListItem, PaginatedList } from "@/api/services/adminService";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminFilterTabs,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { AdminUserTable } from "@/features/dashboard/components/AdminUserTable";
import TextInput from "@/components/ui/TextInput";
import Icon from "@/components/ui/Icon";

type RoleFilter = "all" | "Admin" | "Manager" | "TourOperator" | "TourGuide" | "TransportProvider" | "HotelServiceProvider" | "Customer";

const ROLE_TABS: Array<{ label: string; value: RoleFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Admin", value: "Admin" },
  { label: "Manager", value: "Manager" },
  { label: "TourOperator", value: "TourOperator" },
  { label: "TourGuide", value: "TourGuide" },
  { label: "TransportProvider", value: "TransportProvider" },
  { label: "HotelServiceProvider", value: "HotelServiceProvider" },
  { label: "Customer", value: "Customer" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: Parameters<typeof adminService.getAllUsers>[0] = {
      page: currentPage,
      limit: 10,
      search: debouncedSearch || undefined,
      ...(roleFilter !== "all" && { role: roleFilter }),
      ...(statusFilter && { status: statusFilter }),
    };

    try {
      const result = await adminService.getAllUsers(params);

      if (result && typeof result === "object" && "items" in result) {
        const data = result as PaginatedList<AdminUserListItem>;
        setUsers(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);

        // Always update role counts from API response (server-side computed, always accurate)
        if (data.roleCounts) {
          setRoleCounts(data.roleCounts);
        }
      } else if (!result) {
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tải danh sách người dùng.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers, reloadToken]);

  const handleRefresh = () => {
    setReloadToken((t) => t + 1);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as RoleFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const tabsWithCounts = ROLE_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "all" ? total : roleCounts[tab.value] ?? 0,
  }));

  const kpis = [
    {
      label: "Tổng người dùng",
      value: total.toString(),
      icon: "Users",
      accent: "#C9873A",
    },
    {
      label: "Admin",
      value: (roleCounts["Admin"] ?? 0).toString(),
      icon: "ShieldCheck",
      accent: "#DC2626",
    },
    {
      label: "Manager",
      value: (roleCounts["Manager"] ?? 0).toString(),
      icon: "Briefcase",
      accent: "#C9873A",
    },
    {
      label: "TourOperator",
      value: (roleCounts["TourOperator"] ?? 0).toString(),
      icon: "PaintBrush",
      accent: "#7C3AED",
    },
    {
      label: "TourGuide",
      value: (roleCounts["TourGuide"] ?? 0).toString(),
      icon: "MapTrifold",
      accent: "#2563EB",
    },
    {
      label: "Customer",
      value: (roleCounts["Customer"] ?? 0).toString(),
      icon: "UserCircle",
      accent: "#059669",
    },
    {
      label: "TransportProvider",
      value: (roleCounts["TransportProvider"] ?? 0).toString(),
      icon: "Truck",
      accent: "#EA580C",
    },
    {
      label: "HotelServiceProvider",
      value: (roleCounts["HotelServiceProvider"] ?? 0).toString(),
      icon: "Buildings",
      accent: "#0891B2",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Quản lý người dùng"
        subtitle="Danh sách người dùng hệ thống"
        onRefresh={handleRefresh}
      />

      {/* KPI Strip */}
      <AdminKpiStrip kpis={kpis} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <AdminFilterTabs
          tabs={tabsWithCounts}
          activeValue={roleFilter}
          onChange={handleRoleChange}
        />
        <div className="w-full md:w-72">
          <TextInput
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon="MagnifyingGlass"
            hasicon={false}
          />
        </div>
      </div>

      {/* Content */}
      {error && <AdminErrorCard message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && users.length === 0 && (
        <AdminEmptyState
          icon="Users"
          heading="Không có người dùng nào"
          description="Không tìm thấy người dùng phù hợp với bộ lọc."
        />
      )}

      {!error && !isLoading && users.length > 0 && (
        <AdminUserTable
          users={users}
          isLoading={false}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={handlePageChange}
          onStatusChange={handleRefresh}
        />
      )}

      {isLoading && (
        <AdminUserTable users={[]} isLoading={true} onPageChange={() => {}} />
      )}
    </div>
  );
}
