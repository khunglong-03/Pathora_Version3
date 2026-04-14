"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { adminHotelService, type RoomBlockItem } from "@/api/services/adminHotelService";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminFilterTabs,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import TextInput from "@/components/ui/TextInput";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import Button from "@/components/ui/Button";
import { Plus } from "@phosphor-icons/react";
import { handleApiError } from "@/utils/apiResponse";

import { CreateBlockModal } from "./components/CreateBlockModal";
import { BlocksTable } from "./components/BlocksTable";

type StatusFilter = "all" | "active" | "expired";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang chặn", value: "active" },
  { label: "Đã hết hạn", value: "expired" },
];

export default function HotelBlocksPage() {
  const [blocks, setBlocks] = useState<RoomBlockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadBlocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const now = new Date().toISOString().split("T")[0];
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    if (statusFilter === "active") {
      dateTo = now;
    } else if (statusFilter === "expired") {
      dateFrom = now;
    }

    const params = {
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };

    try {
      const result = await adminHotelService.getRoomBlocks(params);
      if (result) {
        setBlocks(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setBlocks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blocks");
      setBlocks([]);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  const handleRefresh = () => void loadBlocks();

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa chặn phòng này?")) return;
    try {
      await adminHotelService.deleteRoomBlock(id);
      void loadBlocks();
    } catch (err) {
      handleApiError(err);
    }
  };

  const activeCount = blocks.filter((b) => {
    const today = new Date().toISOString().split("T")[0];
    return b.startDate <= today && b.endDate >= today;
  }).length;

  const kpis = [
    {
      label: "Tổng chặn",
      value: total.toString(),
      icon: "Bed",
      accent: "#EA580C",
    },
    {
      label: "Đang chặn",
      value: activeCount.toString(),
      icon: "Warning",
      accent: "#EF4444",
    },
    {
      label: "Đã hết hạn",
      value: (total - activeCount).toString(),
      icon: "CheckCircle",
      accent: "#22C55E",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Chặn Phòng Khách sạn"
        subtitle="Quản lý chặn phòng theo ngày"
        onRefresh={handleRefresh}
        actionButtons={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus size={16} weight="bold" />}
          >
            Thêm chặn phòng
          </Button>
        }
      />

      {/* KPI Strip */}
      <AdminKpiStrip kpis={kpis} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <AdminFilterTabs
          tabs={STATUS_TABS}
          activeValue={statusFilter}
          onChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }}
        />
        <div className="w-full md:w-72">
          <TextInput
            type="text"
            placeholder="Tìm khách sạn, lý do..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon="MagnifyingGlass"
            hasicon={false}
          />
        </div>
      </div>

      {/* Content */}
      {error && <AdminErrorCard message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && blocks.length === 0 && (
        <AdminEmptyState
          icon="Bed"
          heading="Không có chặn phòng"
          description="Không tìm thấy bản ghi chặn phòng nào."
        />
      )}

      {!error && !isLoading && blocks.length > 0 && (
        <>
          <BlocksTable blocks={blocks} onDeleteBlock={handleDeleteBlock} />
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
          <SkeletonTable rows={6} columns={7} />
        </div>
      )}

      <CreateBlockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          void loadBlocks();
        }}
      />
    </div>
  );
}
