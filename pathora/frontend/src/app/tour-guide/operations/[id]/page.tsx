"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService } from "@/api/services/bookingService";
import type { NormalizedTourInstanceDto } from "@/types/tour";
import { isQualifiedBooking } from "@/features/tour-operator/utils/fulfillmentHelpers";
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
  const [activityStatuses, setActivityStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  const allActivitiesCompleted = instance.days?.every(day => 
    day.activities?.every(act => {
      // Find status by tourDayId mapping
      // Note: we might have to use act.id as fallback if tourDayId is not present, but based on previous implementation it uses tourDayId 
      // We will look for it in activityStatuses by matching ID, or fallback to assuming it's done if the tour is done
      const statusObj = activityStatuses.find(s => s.tourDayActivityId === act.id || s.tourDayId === (act as any).tourDayId);
      return statusObj?.status === "Completed" || statusObj?.status === "Cancelled";
    })
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <div className="p-4 md:p-6 pb-0">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 font-medium transition-colors"
        >
          <CaretLeftIcon weight="bold" /> {t("common.buttons.back") || "Quay lại"}
        </button>
        <AdminPageHeader
          title={instance.tourName}
          subtitle={`Mã tour: ${instance.tourCode} • Khởi hành: ${format(new Date(instance.startDate), "dd/MM/yyyy")}`}
        />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 pb-24">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Trạng thái chuyến đi</h3>
            <p className="text-sm text-slate-500 mt-1">
              {isTourCompleted ? "Đã hoàn thành" : isTourInProgress ? "Đang diễn ra" : "Sắp tới"}
            </p>
          </div>
          
          {isTourInProgress && (
            <button
              onClick={handleCompleteTour}
              disabled={!!actionLoading || !allActivitiesCompleted}
              className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                allActivitiesCompleted 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
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
          )}

          {isTourCompleted && (
            <div className="py-2 px-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-2">
              <CheckCircleIcon weight="fill" className="size-5" /> Đã hoàn thành
            </div>
          )}
        </div>

        {/* Itinerary Timeline */}
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
                    <p className="text-slate-500 text-sm sm:pl-12">Không có hoạt động nào trong ngày này.</p>
                  ) : (
                    day.activities.map((act, actIndex) => {
                      // Attempt to find status object
                      const statusObj = activityStatuses.find(s => s.tourDayActivityId === act.id || s.tourDayId === (act as any).tourDayId);
                      
                      const actStatus = statusObj?.status || "Pending";
                      const isPending = actStatus === "Pending";
                      const isStarted = actStatus === "Started";
                      const isCompleted = actStatus === "Completed";
                      
                      // For check-in, the target ID is the original tourDayId (from classification)
                      // The backend's booking service endpoints currently require that ID
                      const targetId = statusObj?.tourDayId || (act as any).tourDayId;

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
                                <h4 className={`font-bold text-sm sm:text-base ${isCompleted ? "text-slate-600" : "text-slate-900"}`}>
                                  {act.title}
                                </h4>
                                {act.startTime && (
                                  <span className="text-xs font-semibold text-slate-500 mt-0.5 inline-block">
                                    {act.startTime.substring(0, 5)} {act.endTime ? `- ${act.endTime.substring(0, 5)}` : ""}
                                  </span>
                                )}
                              </div>
                              <span className={`shrink-0 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${
                                isCompleted ? "bg-emerald-50 text-emerald-600" :
                                isStarted ? "bg-amber-50 text-amber-600" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {actStatus}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                              {act.description || act.transportationName || act.accommodation?.supplierName || "Hoạt động tự do"}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2 border-t border-slate-100">
                              {act.fromLocation && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <MapPinIcon className="shrink-0" /> {act.fromLocation.locationName}
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
      </div>
    </div>
  );
}
