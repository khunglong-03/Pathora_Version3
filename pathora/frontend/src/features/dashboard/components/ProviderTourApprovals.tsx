"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Icon } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceVm } from "@/types/tour";
import dayjs from "dayjs";
import { handleApiError } from "@/utils/apiResponse";

interface ProviderTourApprovalsProps {
  providerType: "hotel" | "transport";
}

export default function ProviderTourApprovals({ providerType }: ProviderTourApprovalsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<number | undefined>(undefined);

  const isHotel = providerType === "hotel";

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tourInstanceService.getProviderAssigned(1, 50, approvalStatus);
      setInstances(result?.data ?? []);
    } catch (error) {
      handleApiError(error);
      toast.error(t("common.errorFetch", "Gặp lỗi khi tải dữ liệu"));
    } finally {
      setLoading(false);
    }
  }, [t, approvalStatus]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 xl:p-10 w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Danh sách Tour được chỉ định</h2>
            <p className="mt-1 text-sm text-slate-500">Các tour đang chờ bạn tiếp nhận và sắp xếp dịch vụ</p>
          </div>
          <div>
            <select
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={approvalStatus ?? ""}
              onChange={(e) => setApprovalStatus(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang chờ duyệt</option>
              <option value="2">Đã duyệt</option>
              <option value="3">Đã từ chối</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 w-full skeleton rounded-3xl"></div>
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-24 text-center">
             <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5">
                <Icon icon="heroicons:inbox" className="size-10 text-slate-400" />
             </div>
            <h3 className="text-xl font-bold text-slate-900">Không có yêu cầu nào</h3>
            <p className="mt-2 text-base text-slate-500 max-w-md">
              Hiện tại bạn chưa được chỉ định vào đợt tour nào với trạng thái này.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => {
              const startDate = dayjs(instance.startDate).format("DD/MM/YYYY");
              const endDate = dayjs(instance.endDate).format("DD/MM/YYYY");
              // Both hotel and transport approvals are now per-activity, not at instance level.
              // We show a generic status on the card and let the detail page show per-activity status.
              const isApproved = approvalStatus === 2;
              const isRejected = approvalStatus === 3;
              const isPending = approvalStatus === 1;

              return (
                <div 
                  key={instance.id} 
                  onClick={() => {
                    if (providerType === "transport") {
                      void router.push(`/transport/tour-approvals/${instance.id}`);
                    } else {
                      void router.push(`/hotel/tour-approvals/${instance.id}`);
                    }
                  }}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:ring-slate-300"
                >
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex items-center justify-between">
                       <span className="inline-flex rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 ring-1 ring-indigo-500/10 inset-ring">
                          {instance.tourCode}
                       </span>
                       <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                         isApproved ? "bg-emerald-50 text-emerald-700" :
                         isRejected ? "bg-rose-50 text-rose-700" :
                         isPending ? "bg-amber-50 text-amber-700" :
                         "bg-indigo-50 text-indigo-700"
                       }`}>
                         {isApproved ? <Icon icon="heroicons:check-circle-solid" className="size-3.5" /> : 
                          isRejected ? <Icon icon="heroicons:x-circle-solid" className="size-3.5" /> : 
                          isPending ? <Icon icon="heroicons:clock-solid" className="size-3.5" /> :
                          <Icon icon="heroicons:information-circle-solid" className="size-3.5" />}
                         {isApproved ? "Đã duyệt" : isRejected ? "Đã từ chối" : isPending ? "Đang chờ" : "Có yêu cầu"}
                       </div>
                    </div>
                    
                    <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {instance.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-500">
                      <div className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-600">
                         <Icon icon="heroicons:calendar" className="size-4.5" />
                      </div>
                      {startDate} - {endDate}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-sm font-medium text-slate-700">
                        <Icon icon="heroicons:user-group" className="size-4 text-slate-400" />
                        {instance.currentParticipation}/{instance.maxParticipation} khách
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-sm font-medium text-slate-700">
                        <Icon icon="heroicons:currency-dollar" className="size-4 text-slate-400" />
                        {instance.basePrice.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between transition-colors group-hover:bg-indigo-50/50">
                     <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">Xem yêu cầu chi tiết</span>
                     <Icon icon="heroicons:arrow-right" className="size-4.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
