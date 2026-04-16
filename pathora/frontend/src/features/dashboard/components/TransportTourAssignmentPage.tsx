"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import Select from "@/components/ui/Select";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { transportProviderService, Vehicle, Driver } from "@/api/services/transportProviderService";
import { TourInstanceDto, TourInstancePlanRouteDto } from "@/types/tour";

export default function TransportTourAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tour, setTour] = useState<TourInstanceDto | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submittingRouteId, setSubmittingRouteId] = useState<string | null>(null);
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
          tourInstanceService.getInstanceDetail(id as string),
          transportProviderService.getVehicles(),
          transportProviderService.getDrivers(),
        ]);

        setTour(tourDetail);
        setVehicles(vehiclesList);
        setDrivers(driversList);

        // Initialize state with existing assignments
        if (tourDetail?.days) {
          const initialAssigns: Record<string, { vehicleId: string; driverId: string }> = {};
          tourDetail.days.forEach(day => {
            day.activities.forEach(act => {
              act.routes?.forEach(route => {
                initialAssigns[route.id] = {
                  vehicleId: route.vehicleId ?? "",
                  driverId: route.driverId ?? "",
                };
              });
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

  const routesList = useMemo(() => {
    const list: { dayTitle: string; activityTitle: string; route: TourInstancePlanRouteDto }[] = [];
    if (!tour?.days) return list;
    
    tour.days.forEach(day => {
      day.activities.forEach(act => {
        act.routes?.forEach(route => {
          list.push({ dayTitle: day.title, activityTitle: act.title, route });
        });
      });
    });
    return list;
  }, [tour]);

  const isAllAssigned = useMemo(() => {
    return routesList.every((item) => {
      const assigned = assignments[item.route.id];
      return assigned?.vehicleId && assigned?.driverId;
    });
  }, [routesList, assignments]);

  const handleAssignmentChange = (routeId: string, field: "vehicleId" | "driverId", value: string) => {
    setAssignments(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        [field]: value
      }
    }));
  };

  const handleSaveRoute = async (routeId: string) => {
    const assign = assignments[routeId];
    if (!assign?.vehicleId || !assign?.driverId) {
      toast.error("Vui lòng chọn cả xe và tài xế.");
      return;
    }

    setSubmittingRouteId(routeId);
    try {
      const result: any = await tourInstanceService.assignVehicleToRoute(id as string, routeId, {
        vehicleId: assign.vehicleId,
        driverId: assign.driverId,
      });
      
      if (result) {
        toast.success("Lưu dữ liệu phần tuyến phụ thành công.");
        if (result.seatCapacityWarning) {
          toast.warning(`Cảnh báo: Sức chứa xe (${result.vehicleSeatCapacity}) nhỏ hơn lượng khách (${result.tourMaxParticipation}).`);
        }
        
        // Refresh tour data
        const updated = await tourInstanceService.getInstanceDetail(id as string);
        setTour(updated);
      }
    } catch (error: any) {
    } finally {
      setSubmittingRouteId(null);
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
          {routesList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
               Không có hoạt động di chuyển nào.
            </div>
          ) : (
            routesList.map(({ dayTitle, activityTitle, route }) => {
              const currentAssigns = assignments[route.id] || { vehicleId: "", driverId: "" };
              const selectedVehicle = vehicles.find(v => v.id === currentAssigns.vehicleId);
              const isCapacityWarning = selectedVehicle && selectedVehicle.seatCapacity < tour.currentParticipation;
              const hasUnsavedChanges = route.vehicleId !== currentAssigns.vehicleId || route.driverId !== currentAssigns.driverId;
              const isSaved = !!(route.vehicleId && route.driverId && !hasUnsavedChanges);

              return (
                <div key={route.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${isSaved ? "border-emerald-200 ring-1 ring-emerald-500/10" : "border-slate-200"}`}>
                  <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{dayTitle} — {activityTitle}</div>
                      <div className="mt-2 flex items-center gap-2 text-lg font-black text-slate-900">
                        {route.pickupLocation} <Icon icon="heroicons:arrow-right" className="size-4 text-slate-400" /> {route.dropoffLocation}
                      </div>
                    </div>
                    {isSaved && <div className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Đã lưu</div>}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Select 
                        label="Chọn Xe Vận Tải"
                        value={currentAssigns.vehicleId}
                        onChange={(e) => handleAssignmentChange(route.id, "vehicleId", e.target.value)}
                        options={vehicleOptions}
                        placeholder="-- Chọn xe --"
                      />
                      {isCapacityWarning && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                           <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                           Xe nhỏ hơn SL khách: {selectedVehicle?.seatCapacity} / {tour.currentParticipation}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                       <Select 
                        label="Chọn Tài Xế"
                        value={currentAssigns.driverId}
                        onChange={(e) => handleAssignmentChange(route.id, "driverId", e.target.value)}
                        options={driverOptions}
                        placeholder="-- Chọn tài xế --"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button 
                      onClick={() => handleSaveRoute(route.id)}
                      disabled={!currentAssigns.vehicleId || !currentAssigns.driverId || (!hasUnsavedChanges && route.vehicleId != null) || submittingRouteId === route.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {submittingRouteId === route.id ? "Đang lưu..." : hasUnsavedChanges ? "Lưu lại" : "Đã Ghi Nhận"}
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
                    <span className="font-medium text-slate-500">Lộ trình cần xe:</span>
                    <span className="font-bold text-slate-900">{routesList.length} lộ trình</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-500">Đã gán xe xong:</span>
                    <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                      {routesList.filter(r => r.route.vehicleId && r.route.driverId).length} / {routesList.length}
                    </span>
                  </div>
                  {routesList.length > 0 && (
                    <div className="pt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${(routesList.filter(r => r.route.vehicleId && r.route.driverId).length / routesList.length) * 100}%` }}
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
