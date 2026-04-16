"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TopBar } from "@/features/dashboard/components/AdminSidebar";
import { Icon } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceVm, TourInstanceDto } from "@/types/tour";
import dayjs from "dayjs";
import { handleApiError } from "@/utils/apiResponse";
import { hotelProviderService, HotelRoomInventory } from "@/api/hotelProviderService";

interface ProviderTourApprovalsProps {
  providerType: "hotel" | "transport";
}

// Room Type translations helper
const getRoomTypeName = (type: string | number) => {
  const typeStr = String(type).toLowerCase();
  const map: Record<string, string> = {
    "1": "Standard", "standard": "Standard",
    "2": "Superior", "superior": "Superior",
    "3": "Deluxe", "deluxe": "Deluxe",
    "4": "Suite", "suite": "Suite",
    "5": "Family", "family": "Family",
    "6": "Connecting", "connecting": "Connecting",
  };
  return map[typeStr] || String(type);
};

export default function ProviderTourApprovals({ providerType }: ProviderTourApprovalsProps) {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Modal states
  const [selectedTour, setSelectedTour] = useState<NormalizedTourInstanceVm | null>(null);
  const [tourDetails, setTourDetails] = useState<TourInstanceDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [inventory, setInventory] = useState<HotelRoomInventory[]>([]);

  // Assignment states
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({});

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

  const loadTourDetails = async (instance: NormalizedTourInstanceVm) => {
    setSelectedTour(instance);
    setTourDetails(null);
    setRoomAssignments({});
    setLoadingDetails(true);
    
    try {
      const [details, inv] = await Promise.all([
        tourInstanceService.getInstanceDetail(instance.id),
        providerType === "hotel" ? hotelProviderService.getInventory() : Promise.resolve([])
      ]);
      setTourDetails(details);
      setInventory(inv);
    } catch (error) {
      handleApiError(error);
      toast.error("Không thể tải chi tiết tour.");
      closeModal();
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedTour(null);
    setTourDetails(null);
    setRoomAssignments({});
  };

  const handleApprove = async (id: string, isApproved: boolean) => {
    try {
      setProcessing(id);
      
      let noteStr = "";
      if (isApproved && providerType === "hotel" && Object.keys(roomAssignments).length > 0) {
        const lines = Object.entries(roomAssignments)
          .filter(([_, val]) => val.trim() !== "")
          .map(([type, val]) => `- Loại ${getRoomTypeName(type)}: ${val}`);
        
        if (lines.length > 0) {
          noteStr = "Đã gán phòng:\n" + lines.join("\n");
        }
      }

      if (providerType === "hotel") {
        await tourInstanceService.hotelApprove(id, isApproved, noteStr || undefined);
      } else {
        await tourInstanceService.transportApprove(id, isApproved);
      }
      toast.success(
        isApproved
          ? t("provider.approvedSuccess", "Đã phê duyệt tour.")
          : t("provider.rejectedSuccess", "Đã từ chối tour.")
      );
      closeModal();
      void fetchAssignments();
    } catch (error) {
      handleApiError(error);
      toast.error(t("common.errorGeneric", "Thao tác thất bại"));
    } finally {
      setProcessing(null);
    }
  };

  // Extract required rooms
  const requiredRooms: Record<string, number> = {};
  if (tourDetails?.days) {
    tourDetails.days.forEach(day => {
      day.activities.forEach(act => {
        if (act.accommodation && act.accommodation.roomType) {
          const t = act.accommodation.roomType;
          requiredRooms[t] = (requiredRooms[t] || 0) + act.accommodation.quantity;
        }
      });
    });
  }
  const hasRequirements = Object.keys(requiredRooms).length > 0;

  return (
    <>
      <TopBar
        title={t("provider.tourApprovals", "Phê duyệt Tour")}
        subtitle={providerType === "hotel" ? "Yêu cầu đặt phòng tour" : "Yêu cầu vận tải tour"}
        onMenuClick={() => {
          const sidebarBtn = document.querySelector('[aria-label="Open menu"]') as HTMLButtonElement | null;
          if (sidebarBtn) sidebarBtn.click();
        }}
      />
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Danh sách Tour được chỉ định</h2>
            <p className="mt-1 text-sm text-slate-500">Các tour đang chờ bạn tiếp nhận và sắp xếp dịch vụ</p>
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
              Hiện tại bạn chưa được chỉ định vào đợt tour nào đang chờ phê duyệt. Trở lại sau nhé.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <div 
                  key={instance.id} 
                  onClick={() => loadTourDetails(instance)}
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
                         "bg-amber-50 text-amber-700"
                       }`}>
                         {isApproved ? <Icon icon="heroicons:check-circle-solid" className="size-3.5" /> : 
                          isRejected ? <Icon icon="heroicons:x-circle-solid" className="size-3.5" /> : 
                          <Icon icon="heroicons:clock-solid" className="size-3.5" />}
                         {isApproved ? "Đã duyệt" : isRejected ? "Đã từ chối" : "Đang chờ"}
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

      {/* Detail Modal Overlay */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">Chi tiết Yêu cầu Tour</h3>
                   <span className="mt-0.5 block text-sm font-medium text-slate-500">{selectedTour.tourCode}</span>
                </div>
                <button onClick={closeModal} className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                  <Icon icon="heroicons:x-mark" className="size-5" />
                </button>
             </div>

             {/* Content Loop */}
             <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                {loadingDetails ? (
                   <div className="flex flex-col items-center justify-center py-12">
                      <Icon icon="heroicons:arrow-path" className="size-8 animate-spin text-indigo-600" />
                      <p className="mt-4 font-medium text-slate-500">Đang tải cấu trúc tour...</p>
                   </div>
                ) : tourDetails ? (
                   <div className="space-y-8">
                      {/* Section: Itinerary basic */}
                      <section>
                         <h4 className="mb-4 text-base font-bold uppercase tracking-wider text-slate-900/60">Thông tin cơ bản</h4>
                         <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                               <div className="text-xs font-bold uppercase text-slate-500">Tên Tour</div>
                               <div className="mt-1 font-semibold text-slate-900">{tourDetails.title}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                               <div className="text-xs font-bold uppercase text-slate-500">Lịch trình</div>
                               <div className="mt-1 font-semibold text-slate-900">
                                  {dayjs(tourDetails.startDate).format("DD/MM/YYYY")} - {dayjs(tourDetails.endDate).format("DD/MM/YYYY")}
                                  <span className="ml-1.5 inline-flex rounded-md bg-slate-200 px-1.5 py-0.5 text-xs">({tourDetails.durationDays} ngày)</span>
                               </div>
                            </div>
                         </div>
                      </section>

                      {/* Section: Hotel Requirements */}
                      {providerType === "hotel" && (
                         <section>
                            <h4 className="mb-4 text-base font-bold uppercase tracking-wider text-slate-900/60">Yêu cầu phòng (Hotel)</h4>
                            
                            {!hasRequirements ? (
                               <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                                  Tour này không có yêu cầu lưu trú cụ thể.
                               </div>
                            ) : (
                               <div className="space-y-4">
                                  {Object.entries(requiredRooms).map(([roomType, qty]) => {
                                     const roomTypeName = getRoomTypeName(roomType);
                                     const invForType = inventory.find(i => String(i.roomType).toLowerCase() === roomType.toLowerCase());
                                     
                                     return (
                                        <div key={roomType} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/30 p-5 sm:flex-row sm:items-start sm:gap-6">
                                            {/* Summary left */}
                                            <div className="sm:w-1/3">
                                               <div className="flex items-center gap-2">
                                                  <div className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                                                     <Icon icon="heroicons:home" className="size-4.5" />
                                                  </div>
                                                  <div className="font-bold text-slate-900">Phòng {roomTypeName}</div>
                                               </div>
                                               <div className="mt-3 text-2xl font-black text-sky-600">{qty} <span className="text-sm font-semibold text-slate-500 uppercase">phòng</span></div>
                                               {invForType && (
                                                  <div className="mt-1 text-xs font-semibold tracking-wide text-slate-400">Kho Ks: {invForType.totalRooms} phòng</div>
                                               )}
                                            </div>

                                            {/* Action right (Assignation) */}
                                            {selectedTour.status === "pendingapproval" && (
                                              <div className="flex-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                                 <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Gán mã số phòng cụ thể
                                                 </label>
                                                 <input 
                                                    type="text" 
                                                    placeholder={`VD: 201, 202, 305... (đủ ${qty} phòng)`}
                                                    value={roomAssignments[roomType] || ''}
                                                    onChange={e => setRoomAssignments(prev => ({...prev, [roomType]: e.target.value}))}
                                                    className="w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                 />
                                                 <p className="mt-2 text-xs font-medium text-slate-400">Các phòng được ghi nhận sẽ gửi cho quản lý tour khi bạn bấm duyệt.</p>
                                              </div>
                                            )}
                                        </div>
                                     );
                                  })}
                               </div>
                            )}
                         </section>
                      )}

                      {/* Section: Transport Details if needed */}
                      {providerType === "transport" && (
                         <section>
                            <h4 className="mb-4 text-base font-bold uppercase tracking-wider text-slate-900/60">Yêu cầu di chuyển (Transport)</h4>
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                              Yêu cầu bạn cung cấp xe cho {tourDetails.maxParticipation} khách. Xác nhận để nhà xe có thể chuẩn bị xe tương ứng.
                            </div>
                         </section>
                      )}
                      
                      <div className="py-4"></div>
                   </div>
                ) : null}
             </div>

             {/* Footer Actions */}
             <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8">
                {selectedTour.status === "pendingapproval" ? (
                   <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => handleApprove(selectedTour.id, false)}
                        disabled={!!processing}
                        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-red-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-colors hover:bg-red-50 hover:ring-red-200 disabled:opacity-50"
                      >
                        {processing === selectedTour.id ? "Đang xử lý..." : "Từ chối dịch vụ"}
                      </button>
                      <button
                        onClick={() => handleApprove(selectedTour.id, true)}
                        disabled={!!processing}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-indigo-600 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {processing === selectedTour.id ? "Đang xử lý..." : "Chấp nhận & Gán phòng"}
                      </button>
                   </div>
                ) : (
                   <div className="flex justify-end">
                      <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold ${
                         selectedTour.hotelApprovalStatus === 2 || selectedTour.transportApprovalStatus === 2
                         ? "bg-emerald-100 text-emerald-700"
                         : "bg-red-100 text-red-700"
                      }`}>
                         Khép lại (Đã xử lý)
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </>
  );
}
