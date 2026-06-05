"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService } from "@/api/services/bookingService";
import type { NormalizedTourInstanceDto } from "@/types/tour";
import { isQualifiedBooking } from "@/features/tour-operator/utils/fulfillmentHelpers";
import { featureFlags } from "@/configs/featureFlags";
import TourGuideTasksPortalSection from "@/features/dashboard/components/TourGuideTasksPortalSection";
import { cn } from "@/lib/cn";
import { 
  CheckCircleIcon, 
  WarningCircleIcon, 
  MapPinIcon,
  CaretLeftIcon,
  CircleIcon,
  PlayCircleIcon
} from "@phosphor-icons/react";
import { format } from "date-fns";

export default function TourOperationDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const instanceId = params.id as string;

  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activityStatuses, setActivityStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"itinerary" | "tasks">("itinerary");

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [instanceData, bookingsData] = await Promise.all([
          tourInstanceService.getInstanceDetail(instanceId),
          bookingService.getBookingsByTourInstance(instanceId)
        ]);

        if (!isMounted) return;
        setInstance(instanceData as NormalizedTourInstanceDto);

        const qualifiedBookings = bookingsData.filter(isQualifiedBooking);
        if (qualifiedBookings.length > 0) {
          setBookings(qualifiedBookings);
          const mainBooking = qualifiedBookings[0];
          setBookingId(mainBooking.id);
          
          try {
            const statuses = await bookingService.getActivityStatuses(mainBooking.id);
            setActivityStatuses(statuses);
          } catch (statusErr) {
            console.error("Failed to load activity statuses", statusErr);
            // Optionally set error, but we might still want to show the tour
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.response?.status === 404 || err?.response?.status === 403) {
          setError(t("common.errors.notFound") || "Không tìm thấy Tour hoặc bạn không có quyền truy cập.");
        } else {
          setError(t("common.errors.loadFailed") || "Đã xảy ra lỗi khi tải dữ liệu.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (instanceId) {
      void fetchData();
    }
    
    return () => { isMounted = false; };
  }, [instanceId, refreshKey, t]);

  const handleStartActivity = async (tourDayId: string) => {
    if (!bookingId) return;
    setActionLoading(`start-${tourDayId}`);
    try {
      await bookingService.startActivity(bookingId, tourDayId, new Date().toISOString());
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert("Lỗi khi Check-in hoạt động. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteActivity = async (tourDayId: string) => {
    if (!bookingId) return;
    setActionLoading(`complete-${tourDayId}`);
    try {
      await bookingService.completeActivity(bookingId, tourDayId, new Date().toISOString());
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert("Lỗi khi hoàn thành hoạt động. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTour = async () => {
    if (!instance) return;
    setActionLoading("complete-tour");
    try {
      await tourInstanceService.changeStatus(instance.id, "Completed" as any);
      setInstance(prev => prev ? { ...prev, status: "Completed" } : null);
      alert("Đã cập nhật trạng thái chuyến đi thành công!");
    } catch (err) {
      alert("Lỗi khi kết thúc chuyến đi. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col p-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium w-fit"
        >
          <CaretLeftIcon weight="bold" /> Quay lại
        </button>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
          <WarningCircleIcon size={48} className="text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-slate-500">{error || "Không tìm thấy dữ liệu."}</p>
        </div>
      </div>
    );
  }

  const isTourInProgress = instance.status === "inprogress";
  const isTourCompleted = instance.status === "completed";
  
  // Check if ALL activities in the entire tour are completed
  const allActivitiesCompleted = instance.days?.every(day => {
    const parentTourDayId = (day as any).tourDayId as string | null | undefined;
    if (!parentTourDayId) return true; // no status tracking → treat as done
    const statusObj = activityStatuses.find(s => s.tourDayId === parentTourDayId);
    return statusObj?.activityStatus === "Completed" || statusObj?.activityStatus === "Cancelled";
  });

  const totalAdults = bookings.reduce((sum, b) => sum + (b.numberAdult || 0), 0);
  const totalChildren = bookings.reduce((sum, b) => sum + (b.numberChild || 0), 0);
  const totalInfants = bookings.reduce((sum, b) => sum + (b.numberInfant || 0), 0);
  const totalGuests = totalAdults + totalChildren;
  const hasParticipants = totalAdults > 0 || totalChildren > 0 || totalInfants > 0;
  const displayParticipation = instance.currentParticipation > 0 ? instance.currentParticipation : totalGuests;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="p-4 md:p-6 pb-0">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors w-fit"
        >
          <CaretLeftIcon weight="bold" className="size-4" /> 
          {t("common.buttons.back", { defaultValue: "Quay lại" }) === "common.buttons.back" ? "Quay lại" : t("common.buttons.back", { defaultValue: "Quay lại" })}
        </button>
        <AdminPageHeader
          title={instance.tourName || instance.title}
          subtitle={`Mã tour: ${instance.tourCode} • Khởi hành: ${format(new Date(instance.startDate), "dd/MM/yyyy")} • Kéo dài: ${instance.durationDays} ngày`}
        />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 pb-24">
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Trạng thái chuyến đi</h3>
              <div className="inline-flex items-center mt-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-2 ${
                  isTourCompleted ? "bg-emerald-100 text-emerald-800" : 
                  isTourInProgress ? "bg-indigo-100 text-indigo-800" : 
                  "bg-slate-100 text-slate-700"
                }`}>
                  {isTourCompleted ? <CheckCircleIcon weight="fill" className="size-4" /> : 
                   isTourInProgress ? <CircleIcon weight="fill" className="size-4 animate-pulse" /> : 
                   <CircleIcon weight="bold" className="size-4" />}
                  {isTourCompleted ? "Đã hoàn thành" : isTourInProgress ? "Đang diễn ra" : "Sắp tới"}
                </span>
              </div>
            </div>
            
            {isTourInProgress && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCompleteTour}
                  disabled={!!actionLoading || !allActivitiesCompleted}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    allActivitiesCompleted 
                      ? "bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98]" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {actionLoading === "complete-tour" ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircleIcon weight="fill" className="size-5" /> 
                      Hoàn Thành Chuyến Đi
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Participants Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Thông tin khách hàng</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{displayParticipation} <span className="text-sm font-medium text-slate-500">/ {instance.maxParticipation} khách</span></p>
              </div>
            </div>
            
            {hasParticipants ? (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Người lớn</span>
                  <span className="font-bold text-slate-900">{totalAdults}</span>
                </div>
                {totalChildren > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">Trẻ em</span>
                    <span className="font-bold text-slate-900">{totalChildren}</span>
                  </div>
                )}
                {totalInfants > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">Em bé</span>
                    <span className="font-bold text-slate-900">{totalInfants}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                Chưa có dữ liệu khách tham gia chi tiết từ booking.
              </div>
            )}

            {featureFlags.enableGuideManifest && (
              <button
                onClick={() => router.push(`/tour-guide/operations/${instance.id}/manifest`)}
                className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t("tourGuide.operations.viewManifest", { defaultValue: "Danh sách hành khách" })}
              </button>
            )}
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-xl shadow-sm border mb-6">
          <button
            onClick={() => setActiveTab("itinerary")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
              activeTab === "itinerary" ? "bg-slate-100 text-slate-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Lịch trình hoạt động
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
              activeTab === "tasks" ? "bg-slate-100 text-slate-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Nhiệm vụ vận hành
          </button>
        </div>

        {activeTab === "itinerary" ? (
          <div className="space-y-6">
            {instance.days?.map((day, dayIndex) => {
            const dayDate = new Date(day.actualDate);
            dayDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isPast = dayDate < today;
            const isToday = dayDate.getTime() === today.getTime();
            const isFuture = dayDate > today;

            return (
              <div key={day.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                <div className={`p-4 border-b flex items-center gap-3 ${isToday ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className={`shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl ${
                    isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : 
                    isPast ? "bg-slate-200 text-slate-600" : 
                    "bg-white border border-slate-200 text-slate-700"
                  }`}>
                    <span className="text-xs font-bold uppercase leading-none opacity-80 mb-0.5">Ngày</span>
                    <span className="text-lg font-black leading-none">{day.instanceDayNumber}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{day.title}</h3>
                    <p className={`text-sm ${isToday ? "text-indigo-600 font-medium" : "text-slate-500"}`}>
                      {format(dayDate, "dd/MM/yyyy")} {isToday && "• Hôm nay"}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6 relative">
                  <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-100 hidden sm:block" />
                  
                  {(!day.activities || day.activities.length === 0) ? (
                    <div className="text-slate-500 text-sm sm:pl-12 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      Không có lịch trình nào trong ngày này.
                    </div>
                  ) : (
                    day.activities.map((act, actIndex) => {
                      // Match the activity status by the parent day's tourDayId (template day ID).
                      // TourDayActivityStatus.tourDayId is the FK to TourDays (template), which
                      // is exposed on the parent TourInstanceDayDto as day.tourDayId.
                      const parentTourDayId = (day as any).tourDayId as string | null | undefined;
                      const statusObj = parentTourDayId
                        ? activityStatuses.find(s => s.tourDayId === parentTourDayId)
                        : undefined;
                      
                      const actStatus = statusObj?.activityStatus || "Pending";
                      const isPending = actStatus === "Pending";
                      const isStarted = actStatus === "Started";
                      const isCompleted = actStatus === "Completed";
                      
                      // targetId = template tourDayId used by the backend activity-status endpoints
                      const targetId = statusObj?.tourDayId || parentTourDayId;

                      // Prevent check-in if the activity is in the future
                      const canCheckIn = !isFuture && !!targetId && isTourInProgress;

                      return (
                        <div key={act.id} className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                          <div className={`hidden sm:flex shrink-0 size-8 rounded-full border-4 bg-white items-center justify-center relative z-10 ${
                            isCompleted ? "border-emerald-500 text-emerald-500" :
                            isStarted ? "border-amber-500 text-amber-500" :
                            isPast ? "border-slate-300 text-slate-300" :
                            "border-slate-200 text-slate-200"
                          }`}>
                            {isCompleted ? <CheckCircleIcon weight="fill" className="size-6" /> : 
                             isStarted ? <div className="size-2.5 bg-amber-500 rounded-full" /> :
                             <CircleIcon weight="fill" className="size-3" />}
                          </div>

                          <div className={`flex-1 w-full bg-white border rounded-xl p-4 transition-all ${
                            isStarted ? "border-amber-200 ring-1 ring-amber-100 shadow-md shadow-amber-900/5" :
                            isCompleted ? "border-slate-200 bg-slate-50/50" :
                            "border-slate-200 shadow-sm"
                          }`}>
                            <div className="flex justify-between items-start mb-2 gap-4">
                              <div>
                                <h4 className={`font-bold text-sm sm:text-base mb-1 ${isCompleted ? "text-slate-600" : "text-slate-900"}`}>
                                  {act.title}
                                </h4>
                                {act.startTime && (
                                  <span className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    {act.startTime.substring(0, 5)} {act.endTime ? `- ${act.endTime.substring(0, 5)}` : ""}
                                  </span>
                                )}
                              </div>
                              <span className={`shrink-0 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border ${
                                isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                isStarted ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>
                                {actStatus === "Pending" ? "Chưa bắt đầu" : actStatus === "Started" ? "Đang diễn ra" : "Hoàn thành"}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">
                              {act.description || act.transportationName || act.accommodation?.supplierName || "Thời gian hoạt động tự do hoặc di chuyển."}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-100">
                              {act.fromLocation && (
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                  <MapPinIcon className="shrink-0 text-slate-400 size-4" weight="fill" /> 
                                  <span>{act.fromLocation.locationName}</span>
                                  {act.toLocation && (
                                    <>
                                      <span className="text-slate-300 mx-1">→</span>
                                      <span>{act.toLocation.locationName}</span>
                                    </>
                                  )}
                                </div>
                              )}
                              
                              <div className="sm:ml-auto mt-2 sm:mt-0 w-full sm:w-auto">
                                {isPending && (
                                  <button
                                    onClick={() => handleStartActivity(targetId)}
                                    disabled={!!actionLoading || !canCheckIn}
                                    className={`w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                      canCheckIn 
                                        ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]" 
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }`}
                                    title={!canCheckIn ? (isFuture ? "Chưa đến ngày" : "Tour chưa bắt đầu") : ""}
                                  >
                                    {actionLoading === `start-${targetId}` ? (
                                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <>Check-in <PlayCircleIcon weight="fill" /></>
                                    )}
                                  </button>
                                )}
                                
                                {isStarted && (
                                  <button
                                    onClick={() => handleCompleteActivity(targetId)}
                                    disabled={!!actionLoading || !targetId}
                                    className="w-full sm:w-auto py-2 px-4 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                  >
                                    {actionLoading === `complete-${targetId}` ? (
                                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <>Hoàn Thành <CheckCircleIcon weight="bold" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <TourGuideTasksPortalSection tourInstanceId={instance.id} />
        )}
      </div>
    </div>
  );
}
