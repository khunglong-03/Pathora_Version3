"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import Select from "@/components/ui/Select";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { transportProviderService, Vehicle, Driver } from "@/api/services/transportProviderService";
import { TourInstanceDto, TourInstanceDayActivityDto } from "@/types/tour";

export default function TransportTourAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tour, setTour] = useState<TourInstanceDto | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submittingActivityId, setSubmittingActivityId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // Local state for assignments to allow changes before saving
  const [assignments, setAssignments] = useState<Record<string, { vehicleId: string; driverId: string }>>({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [tourDetail, vehiclesList, driversList] = await Promise.all([
          tourInstanceService.getMyAssignedInstanceDetail(id as string),
          transportProviderService.getVehicles(),
          transportProviderService.getDrivers(),
        ]);

        setTour(tourDetail);
        setVehicles(vehiclesList);
        setDrivers(driversList);

        // Initialize state with existing assignments — now directly from activity
        if (tourDetail?.days) {
          const initialAssigns: Record<string, { vehicleId: string; driverId: string }> = {};
          tourDetail.days.forEach(day => {
            day.activities.forEach(act => {
              if (act.activityType?.toLowerCase() === "transportation") {
                initialAssigns[act.id] = {
                  vehicleId: act.vehicleId ?? "",
                  driverId: act.driverId ?? "",
                };
              }
            });
          });
          setAssignments(initialAssigns);
        }
      } catch (error) {
        toast.error("Gặp lỗi tải dữ liệu tour.");
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(console.error);
  }, [id]);

  const transportActivities = useMemo(() => {
    const list: { dayTitle: string; activityTitle: string; activity: TourInstanceDayActivityDto }[] = [];
    if (!tour?.days) return list;
    
    tour.days.forEach(day => {
      day.activities.forEach(act => {
        if (act.activityType?.toLowerCase() === "transportation") {
          list.push({ dayTitle: day.title, activityTitle: act.title, activity: act });
        }
      });
    });
    return list;
  }, [tour]);

  const isAllAssigned = useMemo(() => {
    return transportActivities.every((item) => {
      const assigned = assignments[item.activity.id];
      return assigned?.vehicleId && assigned?.driverId;
    });
  }, [transportActivities, assignments]);

  const handleAssignmentChange = (activityId: string, field: "vehicleId" | "driverId", value: string) => {
    setAssignments(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value
      }
    }));
  };

  const handleSaveActivity = async (activityId: string) => {
    const assign = assignments[activityId];
    if (!assign?.vehicleId || !assign?.driverId) {
      toast.error("Vui lòng chọn cả xe và tài xế.");
      return;
    }

    setSubmittingActivityId(activityId);
    try {
      const result: any = await tourInstanceService.assignVehicleToActivity(id as string, activityId, {
        vehicleId: assign.vehicleId,
        driverId: assign.driverId,
      });
      
      if (result) {
        toast.success("Lưu dữ liệu phân công thành công.");
        if (result.seatCapacityWarning) {
          toast.warning(`Cảnh báo: Sức chứa xe (${result.vehicleSeatCapacity}) nhỏ hơn lượng khách (${result.tourMaxParticipation}).`);
        }
        
        // Refresh tour data
        const updated = await tourInstanceService.getMyAssignedInstanceDetail(id as string);
        setTour(updated);
      }
    } catch (error: any) {
    } finally {
      setSubmittingActivityId(null);
    }
  };

  const handleApprove = async () => {
    if (!isAllAssigned) {
      toast.error("Chưa phân xe và tài xế cho tất cả chuyến đi.");
      return;
    }
    setApproving(true);
    try {
      await tourInstanceService.transportApprove(id as string, true, "Đã gán xe/tài xế toàn bộ cho tour.");
      toast.success("Đã phê duyệt lịch trình tour!");
      router.push("/transport/tour-approvals");
    } catch (error: any) {
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await tourInstanceService.transportApprove(id as string, false, rejectNote || undefined);
      toast.success("Đã từ chối tour.");
      router.push("/transport/tour-approvals");
    } catch (error: any) {
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-12">
        <Icon icon="heroicons:arrow-path" className="size-8 animate-spin text-indigo-600" />
        <p className="mt-4 font-medium text-slate-500">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <Icon icon="heroicons:exclamation-triangle" className="size-10 text-amber-500" />
        <p className="text-muted-foreground">Không tìm thấy thông tin tour</p>
        <button onClick={() => router.back()} className="rounded bg-indigo-600 px-4 py-2 text-white">Quay lại</button>
      </div>
    );
  }

  // Pre-calculate Options for selectors
  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.vehiclePlate} (${v.brand || ''} ${v.model || ''}) - ${v.seatCapacity} chỗ` }));
  const driverOptions = drivers.map(d => ({ value: d.id, label: `${d.fullName} (GPLX: ${d.licenseNumber})` }));

  return (
    <div className="p-4 md:p-6 lg:p-8 xl:p-10 w-full mb-20">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 relative">
          <button onClick={() => router.push("/transport/tour-approvals")} className="absolute -left-12 top-2 text-slate-400 hover:text-indigo-600">
            <Icon icon="heroicons:arrow-left" className="size-6" />
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gán Xe & Tài Xế Tour</h1>
          <p className="text-sm font-medium text-slate-500">
            {tour.tourName} ({tour.tourCode}) — {tour.currentParticipation} / {tour.maxParticipation} người (Đã đăng ký)
          </p>
        </div>
        <div className="flex gap-2">
          {tour.transportApprovalStatus === 2 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              <Icon icon="heroicons:check-circle" className="size-4" /> Đã phê duyệt
            </div>
          )}
          {tour.transportApprovalStatus === 3 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 ring-1 ring-red-500/20">
              <Icon icon="heroicons:x-circle" className="size-4" /> Đã từ chối
            </div>
          )}
          {tour.transportApprovalStatus !== 2 && tour.transportApprovalStatus !== 3 && (
            <>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Icon icon="heroicons:x-mark" className="mr-1.5 size-4" />
                {rejecting ? "Đang xử lý..." : "Từ chối"}
              </button>
              <button
                onClick={handleApprove}
                disabled={!isAllAssigned || approving}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500"
              >
                <Icon icon="heroicons:check" className="mr-1.5 size-4" />
                {approving ? "Đang xử lý..." : "Hoàn tất & Duyệt"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
        <div className="space-y-6">
          {transportActivities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
               Không có hoạt động di chuyển nào.
            </div>
          ) : (
            transportActivities.map(({ dayTitle, activityTitle, activity }) => {
              const currentAssigns = assignments[activity.id] || { vehicleId: "", driverId: "" };
              const selectedVehicle = vehicles.find(v => v.id === currentAssigns.vehicleId);
              const isCapacityWarning = selectedVehicle && selectedVehicle.seatCapacity < tour.maxParticipation;
              const hasUnsavedChanges = activity.vehicleId !== currentAssigns.vehicleId || activity.driverId !== currentAssigns.driverId;
              const isSaved = !!(activity.vehicleId && activity.driverId && !hasUnsavedChanges);

              return (
                <div key={activity.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${isSaved ? "border-emerald-200 ring-1 ring-emerald-500/10" : "border-slate-200"}`}>
                  <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{dayTitle} — {activityTitle}</div>
                        <div className="flex px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-xs items-center">
                          <Icon icon="heroicons:users" className="size-3 mr-1"/> Sức chứa yêu cầu: {tour.maxParticipation} chỗ
                        </div>
                      </div>
                      <div className="mt-2 text-slate-900">
                        {activity.pickupLocation && activity.dropoffLocation ? (
                          <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                            {activity.pickupLocation} <Icon icon="heroicons:arrow-right" className="size-4 text-slate-400" /> {activity.dropoffLocation}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                            {activityTitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSaved && <div className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Đã lưu</div>}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Select 
                        label="Chọn Xe Vận Tải"
                        value={currentAssigns.vehicleId}
                        onChange={(e) => handleAssignmentChange(activity.id, "vehicleId", e.target.value)}
                        options={vehicleOptions}
                        placeholder="-- Chọn xe --"
                      />
                      {isCapacityWarning && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse">
                           <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                           Cảnh báo: Xe nhỏ hơn lượng khách tối đa ({selectedVehicle?.seatCapacity} / {tour.maxParticipation})
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                       <Select 
                        label="Chọn Tài Xế"
                        value={currentAssigns.driverId}
                        onChange={(e) => handleAssignmentChange(activity.id, "driverId", e.target.value)}
                        options={driverOptions}
                        placeholder="-- Chọn tài xế --"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button 
                      onClick={() => handleSaveActivity(activity.id)}
                      disabled={!currentAssigns.vehicleId || !currentAssigns.driverId || (!hasUnsavedChanges && activity.vehicleId != null) || submittingActivityId === activity.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {submittingActivityId === activity.id ? "Đang lưu..." : hasUnsavedChanges ? "Lưu lại" : "Đã Ghi Nhận"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
           <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-black text-slate-900">Tổng quan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-500">Khách tham gia:</span>
                    <span className="font-bold text-slate-900">{tour.currentParticipation} / {tour.maxParticipation} người</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-500">Hoạt động cần xe:</span>
                    <span className="font-bold text-slate-900">{transportActivities.length} hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-500">Đã gán xe xong:</span>
                    <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                      {transportActivities.filter(r => r.activity.vehicleId && r.activity.driverId).length} / {transportActivities.length}
                    </span>
                  </div>
                  {transportActivities.length > 0 && (
                    <div className="pt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${(transportActivities.filter(r => r.activity.vehicleId && r.activity.driverId).length / transportActivities.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {tour.transportApprovalStatus !== 2 && tour.transportApprovalStatus !== 3 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-slate-700">Ghi chu tu choi (tuy chon)</h3>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Ly do tu choi neu co..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
