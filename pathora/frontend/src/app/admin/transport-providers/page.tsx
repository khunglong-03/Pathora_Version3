"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminService } from "@/api/services/adminService";
import { userService } from "@/api/services/userService";
import type { TransportProviderListItem, PaginatedList, TransportProviderStats } from "@/types/admin";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminFilterTabs,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { TransportProviderCard } from "@/features/dashboard/components/TransportProviderCard";
import { CreateSupplierModal } from "@/features/dashboard/components/CreateSupplierModal";
import TextInput from "@/components/ui/TextInput";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import Pagination from "@/components/ui/Pagination";
import { MultiSelectContinentDropdown } from "@/components/ui/MultiSelectContinentDropdown";
import { toast } from "react-toastify";

type StatusFilter = "all" | "Active" | "Inactive" | "Pending" | "Banned";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "Active" },
  { label: "Chờ duyệt", value: "Pending" },
  { label: "Bị cấm", value: "Banned" },
  { label: "Ngừng", value: "Inactive" },
];

export default function TransportProvidersPage() {
  const [providers, setProviders] = useState<TransportProviderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);

  // Stats from dedicated endpoint
  const [stats, setStats] = useState<TransportProviderStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await adminService.getTransportProviderStats({
        search: debouncedSearch || undefined,
        continents: selectedContinents,
      });
      if (res) {
        setStats(res);
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  }, [debouncedSearch, selectedContinents]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, reloadToken]);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: Parameters<typeof adminService.getTransportProviders>[0] = {
      page: currentPage,
      limit: 12,
      search: debouncedSearch || undefined,
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedContinents.length > 0 && { continents: selectedContinents }),
    };

    const result = await adminService.getTransportProviders(params);

    if (result && typeof result === "object" && "items" in result) {
      const data = result as PaginatedList<TransportProviderListItem>;
      setProviders(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPendingCount(data.pendingCount ?? 0);
    } else {
      setProviders([]);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearch, statusFilter, selectedContinents, reloadToken]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleRefresh = () => setReloadToken((t) => t + 1);
  const handleContinentsChange = (continents: string[]) => {
    setSelectedContinents(continents);
    setCurrentPage(1);
  };

  const handleToggleBan = async (id: string, currentStatus: string) => {
    const isBanned = currentStatus === "Banned";
    const action = isBanned ? "mở khóa" : "khóa";
    const newStatus = isBanned ? "Active" : "Banned";

    if (!window.confirm(`Bạn có chắc chắn muốn ${action} nhà cung cấp này?`)) {
      return;
    }

    try {
      const res = await userService.updateStatus({ userId: id, newStatus });
      if (res?.success) {
        toast.success(`Đã ${action} nhà cung cấp thành công`);
        handleRefresh();
      } else {
        toast.error(`Không thể ${action} nhà cung cấp`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã xảy ra lỗi");
    }
  };

  const kpis = [
    {
      label: "Tổng nhà cung cấp",
      value: (stats?.total ?? 0).toString(),
      icon: "Van",
      accent: "#0D9488",
    },
    {
      label: "Đang hoạt động",
      value: (stats?.active ?? 0).toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
    {
      label: "Đang chờ xử lý",
      value: (stats?.pending ?? 0).toString(),
      icon: "Hourglass",
      accent: "#C9873A",
    },
  ];

  const tabsWithCounts = STATUS_TABS.map((tab) => {
    let count = 0;
    if (tab.value === "all") count = stats?.total ?? 0;
    else if (tab.value === "Active") count = stats?.active ?? 0;
    else if (tab.value === "Inactive") count = stats?.inactive ?? 0;
    else if (tab.value === "Pending") count = stats?.pending ?? 0;
    else if (tab.value === "Banned") count = stats?.banned ?? 0;
    
    return { ...tab, count };
  });

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Nhà cung cấp Vận tải"
        subtitle="Quản lý các đối tác vận chuyển"
        onRefresh={handleRefresh}
        actionButtons={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#0D9488" }}
          >
            <PlusIcon size={16} weight="bold" />
            Tạo nhà cung cấp
          </button>
        }
      />

      {/* KPI Strip */}
      <AdminKpiStrip kpis={kpis} />

      {/* Filters */}
	      <div className="flex flex-col gap-4 mb-6">
	        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
	          <AdminFilterTabs
	            tabs={tabsWithCounts}
	            activeValue={statusFilter}
	            onChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }}
	          />
	          <div className="w-full md:w-72">
	            <TextInput
	              type="text"
	              placeholder="Tìm kiếm nhà cung cấp..."
	              value={searchInput}
	              onChange={(e) => setSearchInput(e.target.value)}
	              icon="MagnifyingGlass"
	              hasicon={false}
	            />
	          </div>
	        </div>
	        <div className="flex flex-wrap items-center gap-2">
	          <span className="text-sm font-medium" style={{ color: "#6B7280" }}>Châu lục:</span>
	          <MultiSelectContinentDropdown
	            selected={selectedContinents}
	            onChange={handleContinentsChange}
	          />
	        </div>
	      </div>

      {/* Content */}
      {error && <AdminErrorCard message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && providers.length === 0 && (
        <AdminEmptyState
          icon="Van"
          heading="Không có nhà cung cấp nào"
          description="Không tìm thấy nhà cung cấp vận tải phù hợp."
        />
      )}

      {!error && !isLoading && providers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Link href={`/admin/transport-providers/${provider.id}`} key={provider.id} className="block">
                <TransportProviderCard
                  provider={provider}
                  onToggleBan={handleToggleBan}
                />
              </Link>
            ))}
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

      {isLoading && <SkeletonTable rows={6} columns={3} />}

      <CreateSupplierModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          void loadProviders();
        }}
        supplierType="Transport"
        supplierTypeLabel="Vận tải"
        iconBg="#CCFBF1"
        iconColor="#0D9488"
      />
    </div>
  );
}
