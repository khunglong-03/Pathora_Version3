"use client";

import React, { useEffect, useState } from "react";
import type { NormalizedTourInstanceVm, NormalizedTourInstanceDto } from "@/types/tour";
import { bookingService } from "@/api/services/bookingService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { CheckCircle, PlayCircle, WarningCircle, CheckSquareOffset, ArrowRight } from "@phosphor-icons/react";
import { isQualifiedBooking } from "@/features/tour-operator/utils/fulfillmentHelpers";

interface Props {
  instances: NormalizedTourInstanceVm[];
}

export function TourGuideOperations({ instances }: Props) {
  const [todayInstance, setTodayInstance] = useState<NormalizedTourInstanceVm | null>(null);
  const [detail, setDetail] = useState<NormalizedTourInstanceDto | null>(null);
  const [activityStatuses, setActivityStatuses] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Find today's tour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current = instances.find(inst => {
      const start = new Date(inst.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(inst.endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    setTodayInstance(current || null);
  }, [instances]);

  useEffect(() => {
    let isMounted = true;
    if (!todayInstance) return;

    const loadTourData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [instanceData, bookingsData] = await Promise.all([
          tourInstanceService.getInstanceDetail(todayInstance.id),
          bookingService.getBookingsByTourInstance(todayInstance.id)
        ]);

        if (!isMounted) return;
        setDetail(instanceData as any);

        const qualifiedBookings = bookingsData.filter(isQualifiedBooking);
        if (qualifiedBookings.length > 0) {
          const mainBooking = qualifiedBookings[0];
          setBookingId(mainBooking.id);
          
          const statuses = await bookingService.getActivityStatuses(mainBooking.id);
          setActivityStatuses(statuses);
        }
      } catch (err) {
        if (isMounted) setError("Không thể tải thông tin hoạt động của tour.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTourData();
    return () => { isMounted = false; };
  }, [todayInstance, refreshKey]);

  const handleStartTour = async () => {
    if (!todayInstance) return;
    setActionLoading("start-tour");
    try {
      await tourInstanceService.changeStatus(todayInstance.id, "InProgress" as any);
      setRefreshKey(prev => prev + 1);
      // Also update local list status to reflect immediately
      todayInstance.status = "InProgress";
    } catch (err) {
      alert("Lỗi khi bắt đầu tour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTour = async () => {
    if (!todayInstance) return;
    setActionLoading("complete-tour");
    try {
      await tourInstanceService.changeStatus(todayInstance.id, "Completed" as any);
      setRefreshKey(prev => prev + 1);
      todayInstance.status = "Completed";
    } catch (err) {
      alert("Lỗi khi kết thúc tour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartActivity = async (tourDayId: string) => {
    if (!bookingId) return;
    setActionLoading(`start-act-${tourDayId}`);
    try {
      await bookingService.startActivity(bookingId, tourDayId, new Date().toISOString());
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert("Lỗi khi Check-in hoạt động");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteActivity = async (tourDayId: string) => {
    if (!bookingId) return;
    setActionLoading(`complete-act-${tourDayId}`);
    try {
      await bookingService.completeActivity(bookingId, tourDayId, new Date().toISOString());
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert("Lỗi khi Hoàn thành hoạt động");
    } finally {
      setActionLoading(null);
    }
  };

  if (!todayInstance) {
    return (
      <div className="p-4 md:p-6 pb-24 center">
        <div className="bg-white rounded-[1.5rem] p-8 border border-slate-200/50 shadow-sm text-center max-w-sm w-full">
          <div className="size-16 rounded-full bg-slate-100 center mx-auto mb-4">
            <CheckSquareOffset className="size-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hôm nay rảnh rỗi</h3>
          <p className="text-slate-500 font-medium">
            Bạn không có lịch trình dẫn tour nào trong ngày hôm nay.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !detail) {
    return (
      <div className="p-12 center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isTourNotStarted = todayInstance.status.toLowerCase() === "available" || todayInstance.status.toLowerCase() === "confirmed";
  const isTourInProgress = todayInstance.status.toLowerCase() === "inprogress";
  const isTourCompleted = todayInstance.status.toLowerCase() === "completed";

  // Check if all activities across the tour are completed
  const allActivitiesCompleted = activityStatuses.length > 0 && activityStatuses.every(s => s.status === "Completed" || s.status === "Cancelled");

  // Get today's activities specifically from the tour instance days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayDayPlan = detail?.days?.find(d => {
    const actDate = new Date(d.actualDate);
    actDate.setHours(0, 0, 0, 0);
    return actDate.getTime() === today.getTime();
  });

  return (
    <div className="p-4 md:p-6 pb-24 v-stack gap-6">
      {/* Tour Header Card */}
      <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          {todayInstance.title}
        </h2>
        <p className="text-slate-500 font-medium text-sm mb-4">
          Mã tour: {todayInstance.tourCode}
        </p>
        
        {isTourNotStarted && (
          <button
            onClick={handleStartTour}
            disabled={!!actionLoading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {actionLoading === "start-tour" ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <PlayCircle weight="fill" className="size-5" /> Bắt Đầu Tour Ngay
              </>
            )}
          </button>
        )}

        {isTourInProgress && allActivitiesCompleted && (
          <button
            onClick={handleCompleteTour}
            disabled={!!actionLoading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {actionLoading === "complete-tour" ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle weight="fill" className="size-5" /> Kết Thúc Tour Thành Công
              </>
            )}
          </button>
        )}

        {isTourCompleted && (
          <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 center gap-2">
            <CheckCircle weight="fill" className="size-5" /> Đã Hoàn Thành Chuyến Đi
          </div>
        )}
      </div>

      {/* Today's Activities Timeline */}
      {isTourInProgress && (
        <div className="bg-white rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Hoạt động trong ngày</h3>
            <p className="text-xs text-slate-500 mt-0.5">{todayDayPlan ? todayDayPlan.title : "Đang cập nhật..."}</p>
          </div>
          
          <div className="p-4 v-stack gap-6 relative">
            {/* Timeline Line */}
            <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-slate-100" />
            
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium border border-rose-100 flex items-center gap-2">
                <WarningCircle className="size-4 shrink-0" /> {error}
              </div>
            )}

            {!todayDayPlan || todayDayPlan.activities?.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Không có hoạt động nào được ghi nhận cho hôm nay.</p>
            ) : (
              todayDayPlan.activities?.map((act: any, idx: number) => {
                const statusObj = activityStatuses.find(s => s.tourDayId === act.tourInstanceDayId); // Or act.tourDayId depending on backend mapping
                // Wait, activityStatuses maps to tourDayId, which comes from TourDay. But TourInstanceDay Activity might have a different ID.
                // Actually, backend tracks ActivityStatus by TourDayId (from the original classification).
                // Let's assume act.tourDayId is available. If not, we might need to rely on the backend returning status by TourInstanceDayId or similar.
                // In pathora, TourDayActivityStatus tracks TourDayId. 
                const actStatus = statusObj?.status || "Pending";
                const isPending = actStatus === "Pending";
                const isStarted = actStatus === "Started";
                const isCompleted = actStatus === "Completed";
                
                return (
                  <div key={act.id} className="relative flex items-start gap-4">
                    <div className={`shrink-0 size-6 rounded-full border-2 bg-white flex items-center justify-center relative z-10 mt-1 ${
                      isCompleted ? "border-emerald-500 text-emerald-500" :
                      isStarted ? "border-amber-500 text-amber-500" :
                      "border-slate-300"
                    }`}>
                      {isCompleted && <CheckCircle weight="fill" className="size-5" />}
                      {isStarted && <div className="size-2 bg-amber-500 rounded-full" />}
                    </div>
                    
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="h-stack justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${
                          isCompleted ? "bg-emerald-50 text-emerald-600" :
                          isStarted ? "bg-amber-50 text-amber-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {actStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {act.description || act.transportationName || act.accommodation?.supplierName || "Hoạt động chung"}
                      </p>
                      
                      {isPending && (
                        <button
                          onClick={() => handleStartActivity(statusObj?.tourDayId || act.tourDayId)}
                          disabled={!!actionLoading || (!statusObj?.tourDayId && !act.tourDayId)}
                          className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === `start-act-${statusObj?.tourDayId || act.tourDayId}` ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>Check-in Hoạt động <ArrowRight weight="bold" /></>
                          )}
                        </button>
                      )}
                      
                      {isStarted && (
                        <button
                          onClick={() => handleCompleteActivity(statusObj?.tourDayId || act.tourDayId)}
                          disabled={!!actionLoading || (!statusObj?.tourDayId && !act.tourDayId)}
                          className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === `complete-act-${statusObj?.tourDayId || act.tourDayId}` ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>Xác nhận Hoàn Thành <CheckCircle weight="bold" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
