"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  adminHotelService,
  type RoomBlockItem,
  type PaginatedHotelList,
  type CreateRoomBlockDto,
} from "@/api/services/adminHotelService";
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
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Bed, Calendar, Plus } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { handleApiError } from "@/utils/apiResponse";

type StatusFilter = "all" | "active" | "expired";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang chặn", value: "active" },
  { label: "Đã hết hạn", value: "expired" },
];

const createBlockSchema = yup.object({
  accommodationId: yup.string().required("Vui lòng chọn cơ sở lưu trú"),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu").typeError("Ngày bắt đầu không hợp lệ"),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc")
    .typeError("Ngày kết thúc không hợp lệ")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  roomCount: yup
    .number()
    .required("Vui lòng nhập số phòng")
    .typeError("Số phòng phải là số")
    .min(1, "Tối thiểu 1 phòng")
    .max(100, "Tối đa 100 phòng"),
  reason: yup.string().optional().max(500, "Ghi chú tối đa 500 ký tự"),
});

type CreateBlockFormData = yup.InferType<typeof createBlockSchema>;

export default function HotelBlocksPage() {
  const [blocks, setBlocks] = useState<RoomBlockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRefresh = () => setReloadToken((t) => t + 1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBlockFormData>({
    resolver: yupResolver(createBlockSchema) as unknown as Parameters<typeof useForm>[0]["resolver"],
    defaultValues: {
      roomCount: 1,
    },
  });

  const onSubmitCreate = async (data: CreateBlockFormData) => {
    setIsSubmitting(true);
    try {
      await adminHotelService.createRoomBlock(data as CreateRoomBlockDto);
      setIsCreateModalOpen(false);
      reset();
      void loadBlocks();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="rounded-xl border bg-white overflow-hidden" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Khách sạn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loại phòng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Từ ngày</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Đến ngày</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Số phòng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Lý do</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block, idx) => {
                  const today = new Date().toISOString().split("T")[0];
                  const isActive = block.startDate <= today && block.endDate >= today;
                  return (
                    <tr
                      key={block.id}
                      className="transition-colors duration-150 hover:bg-stone-50"
                      style={{ borderBottom: idx < blocks.length - 1 ? "1px solid #F3F4F6" : undefined }}
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
                              {block.supplierName ?? block.accommodationName ?? "—"}
                            </p>
                            {block.accommodationName && (
                              <p className="text-xs" style={{ color: "#9CA3AF" }}>{block.accommodationName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "#374151" }}>{block.roomType}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm" style={{ color: "#374151" }}>{formatDate(block.startDate)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm" style={{ color: "#374151" }}>{formatDate(block.endDate)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold"
                          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                        >
                          {block.roomCount}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: block.reason ? "#374151" : "#9CA3AF" }}>
                          {block.reason ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => void handleDeleteBlock(block.id)}
                          className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
                          style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}
                          title="Xóa chặn phòng"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
          <SkeletonTable rows={6} columns={7} />
        </div>
      )}

      {/* Create Block Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); reset(); }}
        title="Thêm chặn phòng"
        size="md"
      >
        <form onSubmit={void handleSubmit(onSubmitCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
              Cơ sở lưu trú <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <select
              {...register("accommodationId")}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: errors.accommodationId ? "#DC2626" : "#E5E7EB", color: "#111827" }}
            >
              <option value="">— Chọn cơ sở lưu trú —</option>
              <option value="acc-demo">Khách sạn Mai (Demo)</option>
            </select>
            {errors.accommodationId && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.accommodationId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
                Từ ngày <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: errors.startDate ? "#DC2626" : "#E5E7EB", color: "#111827" }}
              />
              {errors.startDate && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
                Đến ngày <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="date"
                {...register("endDate")}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: errors.endDate ? "#DC2626" : "#E5E7EB", color: "#111827" }}
              />
              {errors.endDate && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
              Số phòng chặn <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              {...register("roomCount")}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: errors.roomCount ? "#DC2626" : "#E5E7EB", color: "#111827" }}
            />
            {errors.roomCount && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.roomCount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
              Lý do (tùy chọn)
            </label>
            <textarea
              {...register("reason")}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ borderColor: errors.reason ? "#DC2626" : "#E5E7EB", color: "#111827" }}
              placeholder="VD: Bảo trì, sửa chữa, sự kiện..."
            />
            {errors.reason && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setIsCreateModalOpen(false); reset(); }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Tạo chặn phòng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
