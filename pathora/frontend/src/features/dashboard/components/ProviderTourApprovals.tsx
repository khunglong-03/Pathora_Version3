"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TopBar } from "@/features/dashboard/components/AdminSidebar";
import { Icon } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceVm } from "@/types/tour";
import dayjs from "dayjs";
import { handleApiError } from "@/utils/apiResponse";

interface ProviderTourApprovalsProps {
  providerType: "hotel" | "transport";
}

export default function ProviderTourApprovals({ providerType }: ProviderTourApprovalsProps) {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tourInstanceService.getProviderAssigned(1, 50);
      setInstances(result?.data ?? []);
    } catch (error) {
      handleApiError(error);
      toast.error(t("common.errorFetch", "Gặp lỗi khi tải dữ liệu"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const handleApprove = async (id: string, isApproved: boolean) => {
    try {
      setProcessing(id);
      await tourInstanceService.providerApprove(id, isApproved);
      toast.success(
        isApproved
          ? t("provider.approvedSuccess", "Đã phê duyệt tour.")
          : t("provider.rejectedSuccess", "Đã từ chối tour.")
      );
      void fetchAssignments();
    } catch (error) {
      handleApiError(error);
      toast.error(t("common.errorGeneric", "Thao tác thất bại"));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <TopBar
        title={t("provider.tourApprovals", "Phê duyệt Tour")}
        subtitle={providerType === "hotel" ? "Yêu cầu đặt phòng tour" : "Yêu cầu vận tải tour"}
        onMenuClick={() => {
          // Logic to open sidebar handled by parent/context dynamically if needed (omitted here as it's passed differently)
          const sidebarBtn = document.querySelector('[aria-label="Open menu"]') as HTMLButtonElement | null;
          if (sidebarBtn) sidebarBtn.click();
        }}
      />
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">Danh sách Tour được chỉ định</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full skeleton rounded-2xl"></div>
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
             <Icon icon="heroicons:inbox" className="mx-auto mb-4 size-12 text-stone-300" />
            <h3 className="text-lg font-semibold text-stone-900">Không có yêu cầu nào</h3>
            <p className="mt-1 text-sm text-stone-500">
              Hiện tại bạn chưa được chỉ định vào đợt tour nào đang chờ phê duyệt.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => {
              const startDate = dayjs(instance.startDate).format("DD/MM/YYYY");
              const endDate = dayjs(instance.endDate).format("DD/MM/YYYY");
              const isPending = instance.status === "pendingapproval";
              const myApprovalStatus =
                providerType === "hotel"
                  ? instance.hotelApprovalStatus
                  : instance.transportApprovalStatus;
              const isApproved = myApprovalStatus === 2;
              const isRejected = myApprovalStatus === 3;

              return (
                <div key={instance.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="flex-1 p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                       <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {instance.tourName}
                       </span>
                       <span className={`text-xs font-medium ${
                         isApproved ? "text-emerald-600" :
                         isRejected ? "text-red-600" :
                         "text-orange-600"
                       }`}>
                         {isApproved ? "Đã duyệt" : isRejected ? "Đã từ chối" : "Đang chờ duyệt"}
                       </span>
                    </div>
                    <h3 className="mb-1 text-base font-bold text-stone-900 line-clamp-2">
                      {instance.title}
                    </h3>
                    <p className="mb-4 text-sm text-stone-500">
                      <Icon icon="heroicons:calendar" className="mr-1.5 inline size-4 align-text-bottom" />
                      {startDate} - {endDate}
                    </p>

                    <div className="flex items-center gap-4 text-sm font-medium text-stone-700">
                      <div>
                        <Icon icon="heroicons:user-group" className="mr-1.5 inline size-4 align-text-bottom text-stone-400" />
                        {instance.currentParticipation} / {instance.maxParticipation}
                      </div>
                      <div>
                        <Icon icon="heroicons:currency-dollar" className="mr-1.5 inline size-4 align-text-bottom text-stone-400" />
                        {instance.basePrice.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  </div>

                  {isPending && (
                    <div className="grid grid-cols-2 gap-px border-t border-stone-100 bg-stone-50 p-2">
                      <button
                        onClick={() => handleApprove(instance.id, true)}
                        disabled={!!processing}
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 active:scale-95 disabled:opacity-50"
                      >
                        {processing === instance.id ? (
                          <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                        ) : (
                          <Icon icon="heroicons:check-circle" className="size-4" />
                        )}
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => handleApprove(instance.id, false)}
                        disabled={!!processing}
                        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:scale-95 disabled:opacity-50"
                      >
                        {processing === instance.id ? (
                          <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                        ) : (
                          <Icon icon="heroicons:x-circle" className="size-4" />
                        )}
                        Từ chối
                      </button>
                    </div>
                  )}

                  {!isPending && isApproved && (
                    <div className="border-t border-emerald-100 bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">
                      <Icon icon="heroicons:check-badge" className="mr-1.5 inline size-5 align-text-bottom" />
                      Đã ghi nhận dịch vụ (Booked)
                    </div>
                  )}

                  {!isPending && isRejected && (
                    <div className="border-t border-red-100 bg-red-50 p-3 text-center text-sm font-bold text-red-700">
                      <Icon icon="heroicons:x-circle" className="mr-1.5 inline size-5 align-text-bottom" />
                      Đã từ chối
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
