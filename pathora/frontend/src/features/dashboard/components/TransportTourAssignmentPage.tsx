"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Icon, Modal, Select, Textarea } from "@/components/ui";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import {
  transportProviderService,
  type Driver,
  type Vehicle,
} from "@/api/services/transportProviderService";
import type {
  TourInstanceDayActivityDto,
  TourInstanceDto,
} from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

type TransportActivityItem = {
  dayNumber: number;
  dayTitle: string;
  date: string;
  activity: TourInstanceDayActivityDto;
};

type ApprovalDraft = {
  vehicleId: string;
  driverId: string;
  note: string;
};

const EMPTY_APPROVAL_DRAFT: ApprovalDraft = {
  vehicleId: "",
  driverId: "",
  note: "",
};

const isTransportationActivity = (activityType?: string | null) => {
  const normalized = activityType?.trim().toLowerCase();
  return normalized === "transportation" || normalized === "7";
};

const normalizeApprovalStatus = (status?: string | null) =>
  status?.trim().toLowerCase() ?? "";

const getApprovalAppearance = (status?: string | null) => {
  switch (normalizeApprovalStatus(status)) {
    case "approved":
      return {
        label: "Da duyet",
        icon: "heroicons:check-circle",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
      };
    case "rejected":
      return {
        label: "Da tu choi",
        icon: "heroicons:x-circle",
        className: "bg-rose-50 text-rose-700 ring-rose-500/20",
      };
    case "pending":
      return {
        label: "Dang cho duyet",
        icon: "heroicons:clock",
        className: "bg-amber-50 text-amber-700 ring-amber-500/20",
      };
    default:
      return {
        label: "Chua giao nha cung cap",
        icon: "heroicons:information-circle",
        className: "bg-slate-100 text-slate-600 ring-slate-500/10",
      };
  }
};

const formatDateLabel = (date?: string) => {
  if (!date) return "Chua co ngay";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeRange = (
  activity: TourInstanceDayActivityDto,
) => {
  const start = activity.departureTime ?? activity.startTime;
  const end = activity.arrivalTime ?? activity.endTime;

  if (!start && !end) return null;

  const formatTimeValue = (value: string) => {
    if (value.includes("T")) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return value.slice(0, 5);
  };

  if (start && end) {
    return `${formatTimeValue(start)} - ${formatTimeValue(end)}`;
  }

  return formatTimeValue(start ?? end ?? "");
};

export default function TransportTourAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [tour, setTour] = useState<TourInstanceDto | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveActivityId, setApproveActivityId] = useState<string | null>(null);
  const [rejectActivityId, setRejectActivityId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [approvalDrafts, setApprovalDrafts] = useState<
    Record<string, ApprovalDraft>
  >({});

  const loadData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [tourDetail, vehiclesList, driversList] = await Promise.all([
        tourInstanceService.getMyAssignedInstanceDetail(id),
        transportProviderService.getVehicles(),
        transportProviderService.getDrivers(),
      ]);

      setTour(tourDetail);
      setVehicles(vehiclesList);
      setDrivers(driversList);

      if (tourDetail?.days) {
        const nextDrafts: Record<string, ApprovalDraft> = {};
        tourDetail.days.forEach((day) => {
          day.activities.forEach((activity) => {
            if (!isTransportationActivity(activity.activityType)) return;

            nextDrafts[activity.id] = {
              vehicleId: activity.vehicleId ?? "",
              driverId: activity.driverId ?? "",
              note: activity.transportationApprovalNote ?? "",
            };
          });
        });
        setApprovalDrafts(nextDrafts);
      } else {
        setApprovalDrafts({});
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        apiError.message
          || t(
            "tourInstance.transport.fetchError",
            "Giap loi tai du lieu tour.",
          ),
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const transportActivities = useMemo<TransportActivityItem[]>(() => {
    if (!tour?.days) return [];

    return tour.days.flatMap((day) =>
      day.activities
        .filter((activity) => isTransportationActivity(activity.activityType))
        .map((activity) => ({
          dayNumber: day.instanceDayNumber,
          dayTitle: day.title,
          date: day.actualDate,
          activity,
        })),
    );
  }, [tour]);

  const approvalSummary = useMemo(() => {
    return transportActivities.reduce(
      (summary, item) => {
        switch (normalizeApprovalStatus(item.activity.transportationApprovalStatus)) {
          case "approved":
            summary.approved += 1;
            break;
          case "rejected":
            summary.rejected += 1;
            break;
          case "pending":
            summary.pending += 1;
            break;
          default:
            summary.unassigned += 1;
            break;
        }

        return summary;
      },
      { approved: 0, rejected: 0, pending: 0, unassigned: 0 },
    );
  }, [transportActivities]);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.vehiclePlate} - ${vehicle.vehicleType} - ${vehicle.seatCapacity} cho`,
      })),
    [vehicles],
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        value: driver.id,
        label: `${driver.fullName} (${driver.licenseNumber})`,
      })),
    [drivers],
  );

  const activeApproveItem = useMemo(
    () =>
      transportActivities.find((item) => item.activity.id === approveActivityId)
      ?? null,
    [approveActivityId, transportActivities],
  );

  const activeRejectItem = useMemo(
    () =>
      transportActivities.find((item) => item.activity.id === rejectActivityId)
      ?? null,
    [rejectActivityId, transportActivities],
  );

  const approveDraft = approveActivityId
    ? approvalDrafts[approveActivityId] ?? EMPTY_APPROVAL_DRAFT
    : EMPTY_APPROVAL_DRAFT;

  const rejectDraft = rejectActivityId
    ? approvalDrafts[rejectActivityId] ?? EMPTY_APPROVAL_DRAFT
    : EMPTY_APPROVAL_DRAFT;

  const selectedApproveVehicle = useMemo(
    () =>
      vehicles.find((vehicle) => vehicle.id === approveDraft.vehicleId) ?? null,
    [approveDraft.vehicleId, vehicles],
  );

  const selectedApproveDriver = useMemo(
    () =>
      drivers.find((driver) => driver.id === approveDraft.driverId) ?? null,
    [approveDraft.driverId, drivers],
  );

  const selectedVehicleSeatWarning = Boolean(
    selectedApproveVehicle
    && activeApproveItem?.activity.requestedSeatCount
    && selectedApproveVehicle.seatCapacity
      < activeApproveItem.activity.requestedSeatCount,
  );

  const updateDraft = useCallback(
    (
      activityId: string,
      updates: Partial<ApprovalDraft>,
    ) => {
      setApprovalDrafts((current) => ({
        ...current,
        [activityId]: {
          ...(current[activityId] ?? EMPTY_APPROVAL_DRAFT),
          ...updates,
        },
      }));
    },
    [],
  );

  const openApproveModal = (activity: TourInstanceDayActivityDto) => {
    updateDraft(activity.id, {
      vehicleId: activity.vehicleId ?? "",
      driverId: activity.driverId ?? "",
      note: activity.transportationApprovalNote ?? "",
    });
    setApproveActivityId(activity.id);
  };

  const openRejectModal = (activity: TourInstanceDayActivityDto) => {
    updateDraft(activity.id, {
      note: activity.transportationApprovalNote ?? "",
    });
    setRejectActivityId(activity.id);
  };

  const handleApproveActivity = async () => {
    if (!id || !approveActivityId) return;

    if (!approveDraft.vehicleId || !approveDraft.driverId) {
      toast.error(
        t(
          "tourInstance.transport.missingAssignment",
          "Vui long chon ca xe va tai xe.",
        ),
      );
      return;
    }

    setActionKey(`approve:${approveActivityId}`);
    try {
      await tourInstanceService.approveTransportation(id, approveActivityId, {
        vehicleId: approveDraft.vehicleId,
        driverId: approveDraft.driverId,
        note: approveDraft.note.trim() || undefined,
      });

      toast.success(
        t(
          "tourInstance.transport.approveSuccess",
          "Da duyet yeu cau van chuyen.",
        ),
      );
      setApproveActivityId(null);
      await loadData();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        apiError.message
          || t(
            "tourInstance.transport.approveError",
            "Khong the duyet yeu cau van chuyen.",
          ),
      );
    } finally {
      setActionKey(null);
    }
  };

  const handleRejectActivity = async () => {
    if (!id || !rejectActivityId) return;

    setActionKey(`reject:${rejectActivityId}`);
    try {
      await tourInstanceService.rejectTransportation(id, rejectActivityId, {
        note: rejectDraft.note.trim() || undefined,
      });

      toast.success(
        t(
          "tourInstance.transport.rejectSuccess",
          "Da tu choi yeu cau van chuyen.",
        ),
      );
      setRejectActivityId(null);
      await loadData();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        apiError.message
          || t(
            "tourInstance.transport.rejectError",
            "Khong the tu choi yeu cau van chuyen.",
          ),
      );
    } finally {
      setActionKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-12">
        <Icon icon="heroicons:arrow-path" className="size-8 animate-spin text-indigo-600" />
        <p className="mt-4 font-medium text-slate-500">
          {t("tourInstance.transport.loading", "Dang tai chi tiet...")}
        </p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <Icon icon="heroicons:exclamation-triangle" className="size-10 text-amber-500" />
        <p className="text-slate-500">
          {t("tourInstance.transport.notFound", "Khong tim thay thong tin tour")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/transport/tour-approvals")}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {t("common.back", "Quay lai")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 lg:p-8 xl:p-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push("/transport/tour-approvals")}
              className="absolute -left-12 top-1 hidden text-slate-400 transition-colors hover:text-indigo-600 lg:inline-flex"
            >
              <Icon icon="heroicons:arrow-left" className="size-6" />
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              {t("tourInstance.transport.assignmentLabel", "Transport approval")}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {tour.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {tour.tourCode} • {tour.currentParticipation}/{tour.maxParticipation}{" "}
              {t("tourInstance.transport.guests", "khach")} •{" "}
              {formatDateLabel(tour.startDate)} - {formatDateLabel(tour.endDate)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {t("tourInstance.transport.approved", "Da duyet")}
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-900">
                {approvalSummary.approved}
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                {t("tourInstance.transport.pending", "Dang cho")}
              </p>
              <p className="mt-2 text-3xl font-black text-amber-900">
                {approvalSummary.pending}
              </p>
            </div>
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                {t("tourInstance.transport.rejected", "Da tu choi")}
              </p>
              <p className="mt-2 text-3xl font-black text-rose-900">
                {approvalSummary.rejected}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("tourInstance.transport.totalActivities", "Tong hoat dong")}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {transportActivities.length}
              </p>
            </div>
          </div>
        </div>

        {transportActivities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center text-slate-500">
            {t(
              "tourInstance.transport.empty",
              "Khong co hoat dong van chuyen nao duoc giao cho nha cung cap nay.",
            )}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {transportActivities.map((item) => {
              const appearance = getApprovalAppearance(
                item.activity.transportationApprovalStatus,
              );
              const activityActionKey = actionKey ?? "";
              const timeRange = formatTimeRange(item.activity);
              const isApproved =
                normalizeApprovalStatus(item.activity.transportationApprovalStatus)
                === "approved";

              return (
                <article
                  key={item.activity.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.3)]"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                        {`Day ${item.dayNumber} • ${item.dayTitle}`}
                      </p>
                      <h2 className="text-xl font-black text-slate-900">
                        {item.activity.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon icon="heroicons:calendar" className="size-4 text-slate-400" />
                          {formatDateLabel(item.date)}
                        </span>
                        {timeRange && (
                          <span className="inline-flex items-center gap-1.5">
                            <Icon icon="heroicons:clock" className="size-4 text-slate-400" />
                            {timeRange}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${appearance.className}`}
                    >
                      <Icon icon={appearance.icon} className="size-4" />
                      {appearance.label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t("tourInstance.transport.supplier", "Nha cung cap")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.activity.transportSupplierName
                          || t(
                            "tourInstance.transport.noSupplier",
                            "Chua duoc giao nha cung cap",
                          )}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t("tourInstance.transport.requestedType", "Loai xe yeu cau")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.activity.requestedVehicleType
                          || t("common.notAvailable", "Chua chon")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t("tourInstance.transport.requestedSeats", "So ghe yeu cau")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.activity.requestedSeatCount ?? tour.maxParticipation}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {t("tourInstance.transport.route", "Tuyen")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.activity.pickupLocation && item.activity.dropoffLocation
                          ? `${item.activity.pickupLocation} → ${item.activity.dropoffLocation}`
                          : item.activity.description
                            || t("common.notAvailable", "Chua cap nhat")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:truck" className="size-4 text-cyan-600" />
                      <p className="text-sm font-bold text-cyan-900">
                        {t("tourInstance.transport.assignment", "Xe va tai xe hien tai")}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700/70">
                          {t("tourInstance.transport.vehicle", "Xe")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {item.activity.vehiclePlate
                            ? `${item.activity.vehiclePlate} • ${item.activity.vehicleType ?? ""}`.trim()
                            : t(
                              "tourInstance.transport.noVehicle",
                              "Chua chon xe",
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700/70">
                          {t("tourInstance.transport.driver", "Tai xe")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {item.activity.driverName
                            || t(
                              "tourInstance.transport.noDriver",
                              "Chua chon tai xe",
                            )}
                        </p>
                      </div>
                    </div>
                    {item.activity.transportationApprovalNote && (
                      <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-600">
                        {item.activity.transportationApprovalNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openRejectModal(item.activity)}
                      disabled={activityActionKey === `reject:${item.activity.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon icon="heroicons:x-mark" className="mr-1.5 size-4" />
                      {activityActionKey === `reject:${item.activity.id}`
                        ? t("common.processing", "Dang xu ly...")
                        : t("tourInstance.transport.reject", "Tu choi")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openApproveModal(item.activity)}
                      disabled={activityActionKey === `approve:${item.activity.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon
                        icon={isApproved ? "heroicons:pencil-square" : "heroicons:check"}
                        className="mr-1.5 size-4"
                      />
                      {isApproved
                        ? t(
                          "tourInstance.transport.updateApproval",
                          "Cap nhat duyet",
                        )
                        : t(
                          "tourInstance.transport.approveAction",
                          "Gan xe va duyet",
                        )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(activeApproveItem)}
        onClose={() => setApproveActivityId(null)}
        title={t("tourInstance.transport.approveModal", "Gan xe va duyet")}
        footerContent={(
          <>
            <button
              type="button"
              onClick={() => setApproveActivityId(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {t("common.cancel", "Huy")}
            </button>
            <button
              type="button"
              onClick={handleApproveActivity}
              disabled={
                !approveDraft.vehicleId
                || !approveDraft.driverId
                || actionKey === `approve:${approveActivityId}`
              }
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey === `approve:${approveActivityId}`
                ? t("common.processing", "Dang xu ly...")
                : t("tourInstance.transport.approveAction", "Gan xe va duyet")}
            </button>
          </>
        )}
      >
        {activeApproveItem && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {`Day ${activeApproveItem.dayNumber} • ${activeApproveItem.dayTitle}`}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                {activeApproveItem.activity.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {formatDateLabel(activeApproveItem.date)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label={t("tourInstance.transport.vehicle", "Xe")}
                value={approveDraft.vehicleId}
                onChange={(event) =>
                  updateDraft(activeApproveItem.activity.id, {
                    vehicleId: event.target.value,
                  })
                }
                options={vehicleOptions}
                placeholder={t("tourInstance.transport.selectVehicle", "Chon xe")}
              />
              <Select
                label={t("tourInstance.transport.driver", "Tai xe")}
                value={approveDraft.driverId}
                onChange={(event) =>
                  updateDraft(activeApproveItem.activity.id, {
                    driverId: event.target.value,
                  })
                }
                options={driverOptions}
                placeholder={t("tourInstance.transport.selectDriver", "Chon tai xe")}
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t("tourInstance.transport.requestedType", "Loai xe yeu cau")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {activeApproveItem.activity.requestedVehicleType
                    || t("common.notAvailable", "Chua chon")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t("tourInstance.transport.requestedSeats", "So ghe yeu cau")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {activeApproveItem.activity.requestedSeatCount ?? tour.maxParticipation}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t("tourInstance.transport.selectedVehicle", "Xe dang chon")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedApproveVehicle?.vehiclePlate
                    || t("common.notAvailable", "Chua chon")}
                </p>
              </div>
            </div>

            {selectedVehicleSeatWarning && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {t(
                  "tourInstance.transport.capacityWarning",
                  "Suc chua xe dang chon nho hon so ghe yeu cau.",
                )}
              </div>
            )}

            {selectedApproveDriver && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {`${selectedApproveDriver.fullName} • ${selectedApproveDriver.licenseNumber}`}
              </div>
            )}

            <Textarea
              label={t("tourInstance.transport.note", "Ghi chu")}
              value={approveDraft.note}
              onChange={(event) =>
                updateDraft(activeApproveItem.activity.id, {
                  note: event.target.value,
                })
              }
              placeholder={t(
                "tourInstance.transport.notePlaceholder",
                "Them ghi chu cho yeu cau nay (neu can)",
              )}
              row={4}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(activeRejectItem)}
        onClose={() => setRejectActivityId(null)}
        title={t("tourInstance.transport.rejectModal", "Tu choi yeu cau van chuyen")}
        footerContent={(
          <>
            <button
              type="button"
              onClick={() => setRejectActivityId(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {t("common.cancel", "Huy")}
            </button>
            <button
              type="button"
              onClick={handleRejectActivity}
              disabled={actionKey === `reject:${rejectActivityId}`}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey === `reject:${rejectActivityId}`
                ? t("common.processing", "Dang xu ly...")
                : t("tourInstance.transport.reject", "Tu choi")}
            </button>
          </>
        )}
      >
        {activeRejectItem && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {`Day ${activeRejectItem.dayNumber} • ${activeRejectItem.dayTitle}`}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">
                {activeRejectItem.activity.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {formatDateLabel(activeRejectItem.date)}
              </p>
            </div>

            <Textarea
              label={t("tourInstance.transport.rejectReason", "Ly do tu choi")}
              value={rejectDraft.note}
              onChange={(event) =>
                updateDraft(activeRejectItem.activity.id, {
                  note: event.target.value,
                })
              }
              placeholder={t(
                "tourInstance.transport.rejectPlaceholder",
                "Nhap ly do tu choi de manager co the cap nhat ke hoach",
              )}
              row={4}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
