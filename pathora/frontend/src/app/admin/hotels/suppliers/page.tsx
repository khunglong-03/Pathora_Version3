"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminHotelService, type HotelSupplierItem, type PaginatedHotelList } from "@/api/services/adminHotelService";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminFilterTabs,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { CreateSupplierModal } from "@/features/dashboard/components/CreateSupplierModal";
import TextInput from "@/components/ui/TextInput";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import Pagination from "@/components/ui/Pagination";
import { MultiSelectContinentDropdown } from "@/components/ui/MultiSelectContinentDropdown";
import { Bed, PhoneIcon, EnvelopeSimpleIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";
import { ContinentChip, ContinentChips } from "@/components/shared/ContinentChip";

type StatusFilter = "all" | "Active" | "Inactive";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "Active" },
  { label: "Ngừng", value: "Inactive" },
];

export default function HotelSuppliersPage() {
  const [suppliers, setSuppliers] = useState<HotelSupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedContinents, setSelectedContinents] = useState<string[]>([]);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      limit: 12,
      search: debouncedSearch || undefined,
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(selectedContinents.length > 0 && { continents: selectedContinents }),
    };

    try {
      const result = await adminHotelService.getSuppliers(params);
      if (result) {
        setSuppliers(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
      setSuppliers([]);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearch, statusFilter, selectedContinents]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const handleRefresh = () => setReloadToken((t) => t + 1);
  const handleContinentsChange = (continents: string[]) => {
    setSelectedContinents(continents);
    setCurrentPage(1);
  };

  const activeCount = suppliers.filter((s) => s.status === "Active").length;

  const kpis = [
    {
      label: "Tổng nhà cung cấp",
      value: total.toString(),
      icon: "Bed",
      accent: "#EA580C",
    },
    {
      label: "Đang hoạt động",
      value: activeCount.toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
    {
      label: "Ngừng hoạt động",
      value: (total - activeCount).toString(),
      icon: "Warning",
      accent: "#6B7280",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Nhà cung cấp Khách sạn"
        subtitle="Danh sách đối tác lưu trú cho HotelServiceProvider"
        onRefresh={handleRefresh}
        actionButtons={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#EA580C" }}
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
            tabs={STATUS_TABS}
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

      {!error && !isLoading && suppliers.length === 0 && (
        <AdminEmptyState
          icon="Bed"
          heading="Không có nhà cung cấp nào"
          description="Không tìm thấy nhà cung cấp lưu trú phù hợp."
        />
      )}

      {!error && !isLoading && suppliers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => {
              const isActive = supplier.status === "Active";
              const propertyCount = supplier.propertyCount ?? supplier.accommodationCount ?? 0;
              const continentCount = supplier.continents.length > 0
                ? supplier.continents.length
                : supplier.primaryContinent
                  ? 1
                  : 0;
              return (
                <Link
                  href={`/admin/hotels/suppliers/${supplier.id}`}
                  key={supplier.id}
                  className="block"
                >
                  <div
                    className="rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#FFEDD5" }}
                      >
                        <Bed size={24} weight="fill" style={{ color: "#EA580C" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
                          {supplier.supplierName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: isActive ? "#DCFCE7" : "#F3F4F6",
                              color: isActive ? "#16A34A" : "#6B7280",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }}
                            />
                            {isActive ? "Hoạt động" : "Ngừng"}
                          </span>
                        </div>
                      </div>
                      <ArrowRightIcon size={16} style={{ color: "#9CA3AF" }} className="shrink-0 mt-1" />
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2 mb-4">
                      {supplier.email && (
                        <div className="flex items-center gap-2">
                          <EnvelopeSimpleIcon size={14} style={{ color: "#9CA3AF" }} />
                          <span className="text-xs truncate" style={{ color: "#6B7280" }}>
                            {supplier.email}
                          </span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon size={14} style={{ color: "#9CA3AF" }} />
                          <span className="text-xs" style={{ color: "#6B7280" }}>
                            {supplier.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {supplier.primaryContinent && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                            Khu vực chính
                          </span>
                          <ContinentChip continent={supplier.primaryContinent} size="sm" />
                        </div>
                      )}
                      {supplier.continents.length > 0 &&
                        !(supplier.continents.length === 1 &&
                          supplier.primaryContinent &&
                          supplier.continents[0] === supplier.primaryContinent) && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                              Phạm vi hoạt động
                            </p>
                            <ContinentChips continents={supplier.continents} size="sm" />
                          </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold" style={{ color: "#111827" }}>
                          {propertyCount}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Cơ sở
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold" style={{ color: "#111827" }}>
                          {supplier.roomCount ?? 0}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Phòng
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold" style={{ color: "#111827" }}>
                          {continentCount}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Khu vực
                        </p>
                      </div>
                      {supplier.createdOnUtc && (
                        <div className="flex-1 text-center">
                          <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                            {formatDate(supplier.createdOnUtc)}
                          </p>
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>
                            Ngày tạo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
          void loadSuppliers();
        }}
        supplierType="Accommodation"
        supplierTypeLabel="Khách sạn"
        iconBg="#FFEDD5"
        iconColor="#EA580C"
      />
    </div>
  );
}
