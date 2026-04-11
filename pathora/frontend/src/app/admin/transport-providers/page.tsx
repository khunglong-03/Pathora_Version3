"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminService } from "@/api/services/adminService";
import type { TransportProviderListItem, PaginatedList } from "@/types/admin";
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

type StatusFilter = "all" | "Active" | "Inactive";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "Active" },
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
  }, [currentPage, debouncedSearch, statusFilter, selectedContinents]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleRefresh = () => setReloadToken((t) => t + 1);
  const handleContinentsChange = (continents: string[]) => {
    setSelectedContinents(continents);
    setCurrentPage(1);
  };

  const activeCount = providers.filter((p) => p.status === "Active").length;

  const kpis = [
    {
      label: "Tổng nhà cung cấp",
      value: total.toString(),
      icon: "Van",
      accent: "#0D9488",
    },
    {
      label: "Đang hoạt động",
      value: activeCount.toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
    {
      label: "Đang chờ xử lý",
      value: pendingCount.toString(),
      icon: "Hourbar",
      accent: "#C9873A",
    },
  ];

  const tabsWithCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "all" ? total : (tab.value === "Active" ? activeCount : total - activeCount),
  }));

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
            <Plus size={16} weight="bold" />
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
                <TransportProviderCard provider={provider} />
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
