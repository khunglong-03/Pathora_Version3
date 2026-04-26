"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Icon, Modal, Select, Textarea } from "@/components/ui";
import BulkApproveConfirmationModal, { type BulkApproveItem } from "./BulkApproveConfirmationModal";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import {
  transportProviderService,
  type AvailableVehicle,
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

export type TransportAssignmentRowDraft = {
  vehicleId: string;
  driverId: string;
};

/** Per-activity approve/reject draft: multiple vehicle rows + shared note. */
export type ApprovalDraft = {
  rows: TransportAssignmentRowDraft[];
  note: string;
};

const EMPTY_APPROVAL_DRAFT: ApprovalDraft = {
  rows: [{ vehicleId: "", driverId: "" }],
  note: "",
};

function activityDraftFromActivity(
  activity: TourInstanceDayActivityDto,
): ApprovalDraft {
  const note = activity.transportationApprovalNote ?? "";
  const fromApi = activity.transportAssignments?.filter((t) => t.vehicleId);
  if (fromApi && fromApi.length > 0) {
    return {
      rows: fromApi.map((t) => ({
        vehicleId: t.vehicleId,
        driverId: t.driverId ?? "",
      })),
      note,
    };
  }
  return {
    rows: [
      {
        vehicleId: activity.vehicleId ?? "",
        driverId: activity.driverId ?? "",
      },
    ],
    note,
  };
}

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

function sumSeatCapacityForRows(
  rows: TransportAssignmentRowDraft[],
  vehicles: { id: string; seatCapacity?: number }[],
): number {
  let sum = 0;
  for (const r of rows) {
    if (!r.vehicleId) continue;
    const v = vehicles.find((x) => x.id === r.vehicleId);
    if (v?.seatCapacity) sum += v.seatCapacity;
  }
  return sum;
}

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
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [bulkFailedState, setBulkFailedState] = useState<{
    message: string;
    failedActivityId?: string;
  } | null>(null);
  const [activityErrors, setActivityErrors] = useState<Record<string, string>>({});
  const [availableVehiclesByActivity, setAvailableVehiclesByActivity] = useState<
    Record<string, AvailableVehicle[]>
  >({});
  const [availableVehiclesLoading, setAvailableVehiclesLoading] = useState(false);

  const setActivityError = useCallback((activityId: string, message: string | null) => {
    setActivityErrors((current) => {
      if (message === null) {
        if (!(activityId in current)) return current;
        const next = { ...current };
        delete next[activityId];
        return next;
      }
      return { ...current, [activityId]: message };
    });
  }, []);

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
      setVehicles(vehiclesList?.items || []);
      setDrivers(driversList?.items || []);

      if (tourDetail?.days) {
        const nextDrafts: Record<string, ApprovalDraft> = {};
        tourDetail.days.forEach((day) => {
          day.activities.forEach((activity) => {
            if (!isTransportationActivity(activity.activityType)) return;

            nextDrafts[activity.id] = activityDraftFromActivity(activity);
          });
        });
        setApprovalDrafts(nextDrafts);
      } else {
        setApprovalDrafts({});
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
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
        label: `${vehicle.vehicleType} - ${vehicle.seatCapacity} cho`,
      })),
    [vehicles],
  );

  /** Availability-aware options for the approve modal — shows "Còn trống X/Y". */
  const approveVehicleOptions = useMemo(() => {
    if (!approveActivityId) return vehicleOptions;
    const available = availableVehiclesByActivity[approveActivityId];
    if (!available || available.length === 0) return vehicleOptions;
    return available.map((v) => ({
      value: v.id,
      label: `${v.brand ?? ""} ${v.model ?? ""} – ${v.seatCapacity} chỗ (Còn trống ${v.availableQuantity}/${v.quantity})`.trim(),
    }));
  }, [approveActivityId, availableVehiclesByActivity, vehicleOptions]);

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

  const bulkEligibleActivities = useMemo(() => {
    return transportActivities.filter(
      (item) => normalizeApprovalStatus(item.activity.transportationApprovalStatus) === "pending",
    );
  }, [transportActivities]);

  const bulkIncompleteTitles = useMemo(() => {
    return bulkEligibleActivities
      .filter((item) => {
        const draft = approvalDrafts[item.activity.id] ?? EMPTY_APPROVAL_DRAFT;
        const filled = draft.rows.filter((r) => r.vehicleId && r.driverId);
        if (filled.length === 0) return true;
        if (filled.length !== new Set(filled.map((r) => r.vehicleId)).size) return true;
        const required =
          item.activity.requestedSeatCount ?? tour?.maxParticipation ?? 0;
        const sum = sumSeatCapacityForRows(filled, vehicles);
        if (sum < required) return true;
        const requestedType = item.activity.requestedVehicleType;
        if (requestedType) {
          const badType = filled.some((r) => {
            const v = vehicles.find((x) => x.id === r.vehicleId);
            return v && v.vehicleType !== requestedType;
          });
          if (badType) return true;
        }
        return false;
      })
      .map((item) => item.activity.title);
  }, [bulkEligibleActivities, approvalDrafts, tour?.maxParticipation, vehicles]);

  const approveDraft = approveActivityId
    ? approvalDrafts[approveActivityId] ?? EMPTY_APPROVAL_DRAFT
    : EMPTY_APPROVAL_DRAFT;

  const rejectDraft = rejectActivityId
    ? approvalDrafts[rejectActivityId] ?? EMPTY_APPROVAL_DRAFT
    : EMPTY_APPROVAL_DRAFT;

  const approveModalValidation = useMemo(() => {
    if (!activeApproveItem || !approveActivityId) {
      return {
        typeMismatch: false,
        seatShortfall: false,
        duplicateVehicle: false,
        hasFilledRow: false,
        totalSeats: 0,
        countMismatch: false,
        requestedCount: undefined as number | undefined,
        filledCount: 0,
      };
    }
    const draft = approvalDrafts[approveActivityId] ?? EMPTY_APPROVAL_DRAFT;
    const filled = draft.rows.filter((r) => r.vehicleId && r.driverId);
    const requestedType = activeApproveItem.activity.requestedVehicleType;
    const required =
      activeApproveItem.activity.requestedSeatCount ?? tour?.maxParticipation ?? 0;
    let typeMismatch = false;
    for (const r of filled) {
      const v = vehicles.find((x) => x.id === r.vehicleId);
      if (v && requestedType && v.vehicleType !== requestedType) {
        typeMismatch = true;
        break;
      }
    }
    const duplicateVehicle =
      filled.length > 0
      && filled.map((r) => r.vehicleId).length
        !== new Set(filled.map((r) => r.vehicleId)).size;
    const totalSeats = sumSeatCapacityForRows(filled, vehicles);
    const seatShortfall = filled.length > 0 && totalSeats < required;
    // Scope addendum 2026-04-23: strict vehicle count match when manager set one.
    const requestedCount = activeApproveItem.activity.requestedVehicleCount ?? undefined;
    const countMismatch =
      requestedCount !== undefined && filled.length !== requestedCount;
    return {
      typeMismatch,
      seatShortfall,
      duplicateVehicle,
      hasFilledRow: filled.length > 0,
      totalSeats,
      countMismatch,
      requestedCount,
      filledCount: filled.length,
    };
  }, [
    activeApproveItem,
    approveActivityId,
    approvalDrafts,
    tour?.maxParticipation,
    vehicles,
  ]);

  const updateDraft = useCallback(
    (activityId: string, updates: Partial<ApprovalDraft>) => {
      setApprovalDrafts((current) => {
        const prev = current[activityId] ?? EMPTY_APPROVAL_DRAFT;
        return {
          ...current,
          [activityId]: {
            rows: updates.rows ?? prev.rows,
            note: updates.note !== undefined ? updates.note : prev.note,
          },
        };
      });
    },
    [],
  );

  const patchRow = useCallback(
    (activityId: string, rowIndex: number, partial: Partial<TransportAssignmentRowDraft>) => {
      setApprovalDrafts((current) => {
        const prev = current[activityId] ?? EMPTY_APPROVAL_DRAFT;
        const nextRows = prev.rows.map((r, i) =>
          i === rowIndex ? { ...r, ...partial } : r,
        );
        return { ...current, [activityId]: { ...prev, rows: nextRows } };
      });
    },
    [],
  );

  const addAssignmentRow = useCallback((activityId: string) => {
    setApprovalDrafts((current) => {
      const prev = current[activityId] ?? EMPTY_APPROVAL_DRAFT;
      return {
        ...current,
        [activityId]: {
          ...prev,
          rows: [...prev.rows, { vehicleId: "", driverId: "" }],
        },
      };
    });
  }, []);

  const removeAssignmentRow = useCallback((activityId: string, rowIndex: number) => {
    setApprovalDrafts((current) => {
      const prev = current[activityId] ?? EMPTY_APPROVAL_DRAFT;
      if (prev.rows.length <= 1) return current;
      return {
        ...current,
        [activityId]: {
          ...prev,
          rows: prev.rows.filter((_, i) => i !== rowIndex),
        },
      };
    });
  }, []);

  const openApproveModal = async (activity: TourInstanceDayActivityDto) => {
    setApprovalDrafts((current) => ({
      ...current,
      [activity.id]: activityDraftFromActivity(activity),
    }));
    setApproveActivityId(activity.id);

    // Fetch available vehicles for this activity's date
    const activityDate = tour?.days?.find((d) =>
      d.activities.some((a) => a.id === activity.id)
    )?.actualDate;

    if (activityDate) {
      setAvailableVehiclesLoading(true);
      try {
        const isReApproval =
          normalizeApprovalStatus(activity.transportationApprovalStatus) === "approved";
        const available = await transportProviderService.getAvailableVehicles(
          activityDate,
          undefined,
          isReApproval ? activity.id : undefined,
        );
        setAvailableVehiclesByActivity((prev) => ({
          ...prev,
          [activity.id]: available ?? [],
        }));
      } catch {
        // Fallback: keep using global vehicles list
        setAvailableVehiclesByActivity((prev) => ({
          ...prev,
          [activity.id]: [],
        }));
      } finally {
        setAvailableVehiclesLoading(false);
      }
    }
  };

  const openRejectModal = (activity: TourInstanceDayActivityDto) => {
    updateDraft(activity.id, {
      note: activity.transportationApprovalNote ?? "",
    });
    setRejectActivityId(activity.id);
  };

  const handleApproveActivity = async () => {
    if (!id || !approveActivityId) return;

    const filled = approveDraft.rows.filter((r) => r.vehicleId && r.driverId);
    if (filled.length === 0) {
      toast.error(
        t(
          "tourInstance.transport.missingAssignment",
          "Vui long chon ca xe va tai xe.",
        ),
      );
      return;
    }
    if (approveModalValidation.duplicateVehicle) {
      toast.error(
        t(
          "tourInstance.transport.duplicateVehicle",
          "Khong duoc trung xe trong cung mot hoat dong.",
        ),
      );
      return;
    }
    if (
      approveModalValidation.typeMismatch
      || approveModalValidation.seatShortfall
    ) {
      return;
    }
    if (approveModalValidation.countMismatch) {
      toast.error(
        t(
          "tourInstance.transport.vehicleCountMismatch",
          "So xe duyet phai khop so xe Manager yeu cau ({{required}}).",
          { required: approveModalValidation.requestedCount ?? "?" },
        ),
      );
      return;
    }

    setActionKey(`approve:${approveActivityId}`);
    setActivityError(approveActivityId, null);
    try {
      await tourInstanceService.approveTransportation(id, approveActivityId, {
        assignments: filled.map(({ vehicleId, driverId }) => ({
          vehicleId,
          driverId,
        })),
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
      const message = t(apiError.message);
      toast.error(message);
      setActivityError(approveActivityId, message);
    } finally {
      setActionKey(null);
    }
  };

  const handleRejectActivity = async () => {
    if (!id || !rejectActivityId) return;

    setActionKey(`reject:${rejectActivityId}`);
    setActivityError(rejectActivityId, null);
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
      const message = t(apiError.message);
      toast.error(message);
      setActivityError(rejectActivityId, message);
    } finally {
      setActionKey(null);
    }
  };

  const handleBulkApprove = async (sharedNote: string | undefined) => {
    if (!id) return;

    setActionKey("bulk-approve");
    setBulkFailedState(null);

    const trimmedShared = sharedNote?.trim();
    try {
      for (const item of bulkEligibleActivities) {
        const draft = approvalDrafts[item.activity.id] ?? EMPTY_APPROVAL_DRAFT;
        const filled = draft.rows.filter((r) => r.vehicleId && r.driverId);
        const note = (trimmedShared || draft.note.trim()) || undefined;
        await tourInstanceService.approveTransportation(
          id,
          item.activity.id,
          {
            assignments: filled.map(({ vehicleId, driverId }) => ({
              vehicleId,
              driverId,
            })),
            note,
          },
        );
      }

      setIsBulkApproveModalOpen(false);
      toast.success(
        t("tourInstance.transport.bulkApproveSuccess", "Da duyet {{count}} yeu cau", { count: bulkEligibleActivities.length })
      );

      await loadData();
    } catch (error) {
      const apiError = handleApiError(error);
      const failedActivityId = (error as any)?.response?.data?.failedActivityId;

      setBulkFailedState({
        message: t(apiError.message),
        failedActivityId,
      });
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

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
                  {t("tourInstance.transport.total", "Tong hoat dong")}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {transportActivities.length}
                </p>
              </div>
            </div>

            {bulkEligibleActivities.length > 0 && (
              <div className="flex flex-col gap-2 self-start lg:self-stretch lg:justify-end">
                <button
                  type="button"
                  disabled={bulkIncompleteTitles.length > 0}
                  onClick={() => setIsBulkApproveModalOpen(true)}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-indigo-300"
                  aria-describedby={bulkIncompleteTitles.length > 0 ? "bulk-incomplete-reason" : undefined}
                >
                  {t("tourInstance.transport.bulkApprove", "Duyệt hàng loạt ({{count}})", { count: bulkEligibleActivities.length })}
                </button>
                {bulkIncompleteTitles.length > 0 && (
                  <p className="text-xs text-amber-700 max-w-xs" id="bulk-incomplete-reason">
                    {t("tourInstance.transport.bulkIncompleteReason", "Còn {{count}} hoạt động chưa chọn đủ xe/tài xế:", { count: bulkIncompleteTitles.length })} {bulkIncompleteTitles.slice(0, 3).join(", ")}{bulkIncompleteTitles.length > 3 ? "..." : ""}
                  </p>
                )}
              </div>
            )}
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
              const draft = approvalDrafts[item.activity.id] ?? EMPTY_APPROVAL_DRAFT;

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
                    {item.activity.requestedVehicleCount != null && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {t("tourInstance.transport.requestedVehicles", "So xe yeu cau")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {item.activity.requestedVehicleCount}
                        </p>
                      </div>
                    )}
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
                    {item.activity.transportAssignments
                    && item.activity.transportAssignments.length > 0 ? (
                      <ul className="mt-3 space-y-3">
                        {item.activity.transportAssignments.map((ta) => (
                          <li
                            key={ta.id}
                            className="rounded-xl border border-cyan-100/80 bg-white/70 px-3 py-2 text-sm"
                          >
                            <p className="font-semibold text-slate-900">
                              {ta.vehicleType
                                ? `${ta.vehicleType}`
                                : t("tourInstance.transport.noVehicle", "Chua chon xe")}
                            </p>
                            <p className="mt-0.5 text-slate-600">
                              {ta.driverName
                                || t(
                                  "tourInstance.transport.noDriver",
                                  "Chua chon tai xe",
                                )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700/70">
                            {t("tourInstance.transport.vehicle", "Xe")}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.activity.vehicleType
                              ? `${item.activity.vehicleType}`
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
                    )}
                    {item.activity.transportationApprovalNote && (
                      <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-600">
                        {item.activity.transportationApprovalNote}
                      </p>
                    )}
                  </div>

                  {activityErrors[item.activity.id] && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                    >
                      <Icon icon="heroicons:exclamation-circle" className="mt-0.5 size-4 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">
                          {t("tourInstance.transport.rowErrorTitle", "Thao tac that bai")}
                        </p>
                        <p className="mt-0.5">{activityErrors[item.activity.id]}</p>
                      </div>
                      <button
                        type="button"
                        className="text-rose-500 hover:text-rose-700"
                        onClick={() => setActivityError(item.activity.id, null)}
                        aria-label={t("common.dismiss", "Dong")}
                      >
                        <Icon icon="heroicons:x-mark" className="size-4" />
                      </button>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openRejectModal(item.activity)}
                      disabled={
                        actionKey === `reject:${item.activity.id}`
                        || actionKey === "bulk-approve"
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon
                        icon={
                          actionKey === `reject:${item.activity.id}`
                            ? "heroicons:arrow-path"
                            : "heroicons:x-mark"
                        }
                        className={`size-4 ${
                          actionKey === `reject:${item.activity.id}` ? "animate-spin" : ""
                        }`}
                      />
                      {t("tourInstance.transport.reject", "Tu choi")}
                    </button>
                    <button
                      type="button"
                      disabled={
                        actionKey === `approve:${item.activity.id}`
                        || actionKey === "bulk-approve"
                      }
                      onClick={() => openApproveModal(item.activity)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon
                        icon={
                          actionKey === `approve:${item.activity.id}`
                            ? "heroicons:arrow-path"
                            : isApproved
                              ? "heroicons:pencil-square"
                              : "heroicons:check"
                        }
                        className={`size-4 ${
                          actionKey === `approve:${item.activity.id}` ? "animate-spin" : ""
                        }`}
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
                !approveModalValidation.hasFilledRow
                || approveModalValidation.duplicateVehicle
                || approveModalValidation.typeMismatch
                || approveModalValidation.seatShortfall
                || approveModalValidation.countMismatch
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

            <div className="space-y-3">
              {/* No vehicles available for this date */}
              {approveActivityId
                && !availableVehiclesLoading
                && availableVehiclesByActivity[approveActivityId]
                && availableVehiclesByActivity[approveActivityId].length === 0 && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <Icon icon="heroicons:exclamation-triangle" className="mt-0.5 size-5 shrink-0 text-amber-500" />
                  <p>
                    {t(
                      "tourInstance.transport.noAvailableVehicles",
                      "Không có xe nào khả dụng vào ngày này. Tất cả xe đã được đặt hết.",
                    )}
                  </p>
                </div>
              )}
              {approveDraft.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <Select
                    label={t("tourInstance.transport.vehicle", "Xe")}
                    value={row.vehicleId}
                    onChange={(event) =>
                      patchRow(activeApproveItem.activity.id, rowIndex, {
                        vehicleId: event.target.value,
                      })
                    }
                    options={approveVehicleOptions}
                    placeholder={
                      availableVehiclesLoading
                        ? t("tourInstance.wizard.vehicleType.loadingVehicles", "Đang tải xe…")
                        : t("tourInstance.transport.selectVehicle", "Chon xe")
                    }
                    disabled={availableVehiclesLoading}
                  />
                  <Select
                    label={t("tourInstance.transport.driver", "Tai xe")}
                    value={row.driverId}
                    onChange={(event) =>
                      patchRow(activeApproveItem.activity.id, rowIndex, {
                        driverId: event.target.value,
                      })
                    }
                    options={driverOptions}
                    placeholder={t("tourInstance.transport.selectDriver", "Chon tai xe")}
                  />
                  <div className="flex justify-end pb-1">
                    {approveDraft.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeAssignmentRow(
                            activeApproveItem.activity.id,
                            rowIndex,
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {t("tourInstance.transport.removeRow", "Xoa dong")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addAssignmentRow(activeApproveItem.activity.id)}
                disabled={
                  approveModalValidation.requestedCount !== undefined
                  && approveDraft.rows.length >= approveModalValidation.requestedCount
                }
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("tourInstance.transport.addVehicleRow", "+ Them xe")}
              </button>
              {approveModalValidation.requestedCount !== undefined && (
                <p
                  className={`text-xs font-semibold ${
                    approveModalValidation.countMismatch
                      ? "text-rose-600"
                      : "text-slate-500"
                  }`}
                >
                  {t(
                    "tourInstance.transport.vehicleCountStatus",
                    "{{filled}}/{{required}} xe",
                    {
                      filled: approveModalValidation.filledCount,
                      required: approveModalValidation.requestedCount,
                    },
                  )}
                </p>
              )}
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
                  {t("tourInstance.transport.totalSelectedSeats", "Tong cho da chon")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {approveModalValidation.totalSeats}
                </p>
              </div>
            </div>

            {(approveModalValidation.typeMismatch
              || approveModalValidation.seatShortfall
              || approveModalValidation.duplicateVehicle) && (
              <div className="space-y-1">
                <div role="alert" id="approve-vehicle-select" className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {approveModalValidation.duplicateVehicle && (
                    <p>
                      {t(
                        "tourInstance.transport.duplicateVehicleHint",
                        "Khong duoc chon cung mot xe cho nhieu dong.",
                      )}
                    </p>
                  )}
                  {approveModalValidation.typeMismatch && (
                    <p>
                      {t("tourInstance.transport.typeMismatch", "Loại xe không khớp với yêu cầu")}
                      {" "}
                      (
                      {t("tourInstance.transport.needType", "can")}
                      {" "}
                      {activeApproveItem?.activity.requestedVehicleType}
                      )
                    </p>
                  )}
                  {approveModalValidation.seatShortfall && (
                    <p>
                      {t("tourInstance.transport.capacityShortfall", "Sức chứa không đủ")}
                      {" "}
                      (
                      {t("tourInstance.transport.needSeats", "can")}
                      {" "}
                      {activeApproveItem?.activity.requestedSeatCount ?? tour?.maxParticipation ?? 0}
                      {", "}
                      {t("tourInstance.transport.selectedSeatsSum", "tong cho")}
                      {" "}
                      {approveModalValidation.totalSeats}
                      )
                    </p>
                  )}
                </div>
                <div className="px-1 text-xs">
                  <a href="mailto:manager@example.com?subject=Yêu cầu đổi loại xe cho tour" className="text-indigo-600 underline hover:text-indigo-800">
                    {t("tourInstance.transport.contactManager", "Liên hệ manager để đổi loại xe yêu cầu")}
                  </a>
                </div>
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
              label={t("tourInstance.transport.note", "Ghi chu")}
              value={rejectDraft.note}
              onChange={(event) =>
                updateDraft(activeRejectItem.activity.id, {
                  note: event.target.value,
                })
              }
              placeholder={t(
                "tourInstance.transport.rejectReasonPlaceholder",
                "Nhap ly do tu choi (bat buoc)",
              )}
              row={4}
            />
          </div>
        )}
      </Modal>

      <BulkApproveConfirmationModal
        open={isBulkApproveModalOpen}
        onClose={() => {
          if (actionKey !== "bulk-approve") {
            setIsBulkApproveModalOpen(false);
            setBulkFailedState(null);
          }
        }}
        items={bulkEligibleActivities as BulkApproveItem[]}
        drafts={approvalDrafts}
        vehicles={vehicles}
        drivers={drivers}
        onConfirm={handleBulkApprove}
        failedState={bulkFailedState}
      />
    </>
  );
}
