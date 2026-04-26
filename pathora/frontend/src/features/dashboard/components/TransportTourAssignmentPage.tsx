"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

import { Icon, Modal, Select, Textarea } from "@/components/ui";
import BulkApproveConfirmationModal, { type BulkApproveItem } from "./BulkApproveConfirmationModal";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import {
  transportProviderService,
  type AvailableVehicle,
  type Driver,
  type Vehicle,
} from "@/api/services/transportProviderService";
import {
  vehicleTypeNameToKey,
  type TourInstanceDayActivityDto,
  type TourInstanceDto,
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
  const requestedCount = activity.requestedVehicleCount && activity.requestedVehicleCount > 0 ? activity.requestedVehicleCount : 1;
  return {
    rows: Array.from({ length: requestedCount }).map(() => ({
      vehicleId: "",
      driverId: "",
    })),
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

  const [availableDriversByActivity, setAvailableDriversByActivity] = useState<
    Record<string, Driver[]>
  >({});
  const [availableDriversLoading, setAvailableDriversLoading] = useState(false);

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

  /** Availability-aware options for drivers in the approve modal. */
  const approveDriverOptions = useMemo(() => {
    if (!approveActivityId) return driverOptions;
    const available = availableDriversByActivity[approveActivityId];
    if (!available || available.length === 0) return driverOptions;
    return available.map((d) => ({
      value: d.id,
      label: `${d.fullName} (${d.licenseNumber})`,
    }));
  }, [approveActivityId, availableDriversByActivity, driverOptions]);

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
    const duplicateDriver =
      filled.length > 0
      && filled.map((r) => r.driverId).length
        !== new Set(filled.map((r) => r.driverId)).size;
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
      duplicateDriver,
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

    // Fetch available vehicles and drivers for this activity's date
    const activityDate = tour?.days?.find((d) =>
      d.activities.some((a) => a.id === activity.id)
    )?.actualDate;

    if (activityDate) {
      setAvailableVehiclesLoading(true);
      setAvailableDriversLoading(true);
      try {
        const isReApproval =
          normalizeApprovalStatus(activity.transportationApprovalStatus) === "approved";
        const vType = activity.requestedVehicleType
          ? vehicleTypeNameToKey(activity.requestedVehicleType)
          : undefined;

        const [availableVehicles, availableDrivers] = await Promise.all([
          transportProviderService.getAvailableVehicles(
            activityDate,
            vType,
            isReApproval ? activity.id : undefined,
          ),
          transportProviderService.getAvailableDrivers(
            activityDate,
            isReApproval ? activity.id : undefined,
          )
        ]);

        setAvailableVehiclesByActivity((prev) => ({
          ...prev,
          [activity.id]: availableVehicles ?? [],
        }));
        setAvailableDriversByActivity((prev) => ({
          ...prev,
          [activity.id]: availableDrivers ?? [],
        }));
      } catch {
        // Fallback: keep using global lists
        setAvailableVehiclesByActivity((prev) => ({
          ...prev,
          [activity.id]: [],
        }));
        setAvailableDriversByActivity((prev) => ({
          ...prev,
          [activity.id]: [],
        }));
      } finally {
        setAvailableVehiclesLoading(false);
        setAvailableDriversLoading(false);
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
      const failedActivityId = (error as { response?: { data?: { failedActivityId?: string } } })?.response?.data?.failedActivityId;

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
    <div className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-10 font-sans text-slate-800">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => router.push("/transport/tour-approvals")}
            className="absolute -left-12 top-2 hidden text-slate-400 transition-all hover:text-slate-900 hover:-translate-x-1 lg:inline-flex"
          >
            <Icon icon="heroicons:arrow-left" className="size-6 stroke-[1.5]" />
          </button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              {t("tourInstance.transport.assignmentLabel", "Transport approval")}
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tighter text-slate-950">
              {tour.title}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500 flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs">{tour.tourCode}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{tour.currentParticipation}/{tour.maxParticipation}</span> {t("tourInstance.transport.guests", "khach")}
              <span>•</span>
              {formatDateLabel(tour.startDate)} - {formatDateLabel(tour.endDate)}
            </p>
          </motion.div>
        </div>

        {bulkEligibleActivities.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col gap-2 self-start lg:self-end">
            <button
              type="button"
              disabled={bulkIncompleteTitles.length > 0}
              onClick={() => setIsBulkApproveModalOpen(true)}
              className="group relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_15px_25px_-10px_rgba(0,0,0,0.4)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              aria-describedby={bulkIncompleteTitles.length > 0 ? "bulk-incomplete-reason" : undefined}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Icon icon="heroicons:bolt" className="size-4" />
                {t("tourInstance.transport.bulkApprove", "Duyệt hàng loạt ({{count}})", { count: bulkEligibleActivities.length })}
              </div>
            </button>
            {bulkIncompleteTitles.length > 0 && (
              <p className="max-w-[240px] text-xs text-amber-600" id="bulk-incomplete-reason">
                {t("tourInstance.transport.bulkIncompleteReason", "Còn {{count}} hoạt động chưa chọn đủ xe/tài xế:", { count: bulkIncompleteTitles.length })} {bulkIncompleteTitles.slice(0, 3).join(", ")}{bulkIncompleteTitles.length > 3 ? "..." : ""}
              </p>
            )}
          </motion.div>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        {/* LEFT COLUMN: BENTO STATS */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-10 lg:h-max">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, type: "spring", stiffness: 100 }} className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Activities</p>
              <p className="mt-2 font-mono text-4xl font-black tracking-tight text-slate-900">{transportActivities.length}</p>
            </div>
            <div className="rounded-[2rem] border border-amber-200/50 bg-amber-50/50 p-6 shadow-[0_20px_40px_-15px_rgba(251,191,36,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pending</p>
              <p className="mt-2 font-mono text-4xl font-black tracking-tight text-amber-900">{approvalSummary.pending}</p>
            </div>
            <div className="rounded-[2rem] border border-emerald-200/50 bg-emerald-50/50 p-6 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Approved</p>
              <p className="mt-2 font-mono text-4xl font-black tracking-tight text-emerald-900">{approvalSummary.approved}</p>
            </div>
            <div className="rounded-[2rem] border border-rose-200/50 bg-rose-50/50 p-6 shadow-[0_20px_40px_-15px_rgba(244,63,94,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Rejected</p>
              <p className="mt-2 font-mono text-4xl font-black tracking-tight text-rose-900">{approvalSummary.rejected}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }} className="rounded-[2rem] border border-slate-200/50 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Icon icon="heroicons:information-circle" className="size-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Quy định phê duyệt</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <li className="flex items-start gap-3">
                <Icon icon="heroicons:check-badge" className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                <span>Bắt buộc chọn đủ <strong>Xe</strong> và <strong>Tài xế</strong> cho mỗi hoạt động trước khi duyệt.</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="heroicons:squares-2x2" className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                <span>Số lượng ghế tổng cộng phải <strong>{">="} {tour.maxParticipation}</strong> hoặc bằng số ghế yêu cầu.</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="heroicons:truck" className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                <span>Nên ưu tiên gán các xe có ghi chú <strong>Còn trống</strong> để tối ưu hiệu suất.</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY LIST */}
        <div>
          {transportActivities.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.02)]">
              <div className="rounded-full bg-slate-50 p-4 mb-4">
                <Icon icon="heroicons:document-text" className="size-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                {t("tourInstance.transport.empty", "Khong co hoat dong van chuyen nao duoc giao cho nha cung cap nay.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {transportActivities.map((item, index) => {
                  const appearance = getApprovalAppearance(item.activity.transportationApprovalStatus);
                  const isApproved = normalizeApprovalStatus(item.activity.transportationApprovalStatus) === "approved";
                  const timeRange = formatTimeRange(item.activity);
                  
                  return (
                    <motion.article
                      key={item.activity.id}
                      layoutId={`activity-${item.activity.id}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: index * 0.05, type: "spring", stiffness: 100, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] md:p-8"
                    >
                      {/* Inner Glass Refraction */}
                      <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />

                      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Day {item.dayNumber}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${appearance.className}`}>
                              {appearance.label}
                            </span>
                          </div>
                          
                          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {item.activity.title}
                          </h2>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Icon icon="heroicons:calendar" className="size-4 opacity-70" />
                              {formatDateLabel(item.date)}
                            </span>
                            {timeRange && (
                              <span className="flex items-center gap-1.5">
                                <Icon icon="heroicons:clock" className="size-4 opacity-70" />
                                {timeRange}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openRejectModal(item.activity)}
                            disabled={actionKey === `reject:${item.activity.id}` || actionKey === "bulk-approve"}
                            className="group/btn flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-[1px] disabled:opacity-50"
                            aria-label={t("tourInstance.transport.reject", "Tu choi")}
                          >
                            <Icon icon={actionKey === `reject:${item.activity.id}` ? "heroicons:arrow-path" : "heroicons:x-mark"} className={`size-5 ${actionKey === `reject:${item.activity.id}` ? "animate-spin" : ""}`} />
                          </button>
                          <button
                            type="button"
                            disabled={actionKey === `approve:${item.activity.id}` || actionKey === "bulk-approve"}
                            onClick={() => openApproveModal(item.activity)}
                            className="group/btn flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 hover:-translate-y-[1px] hover:shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] disabled:opacity-50"
                          >
                            <Icon icon={actionKey === `approve:${item.activity.id}` ? "heroicons:arrow-path" : isApproved ? "heroicons:pencil-square" : "heroicons:plus"} className={`size-4 ${actionKey === `approve:${item.activity.id}` ? "animate-spin" : ""}`} />
                            {isApproved ? t("tourInstance.transport.updateApproval", "Cap nhat") : t("tourInstance.transport.approveAction", "Gan xe")}
                          </button>
                        </div>
                      </div>

                      {/* Info Bento Blocks inside Card */}
                      <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yêu cầu xe</p>
                          <p className="mt-1 font-semibold text-slate-900">{item.activity.requestedVehicleType || "Bất kỳ"}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số ghế yêu cầu</p>
                          <p className="mt-1 font-semibold text-slate-900">{item.activity.requestedSeatCount ?? tour.maxParticipation}</p>
                        </div>
                        {item.activity.requestedVehicleCount != null && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số lượng xe</p>
                            <p className="mt-1 font-semibold text-slate-900">{item.activity.requestedVehicleCount}</p>
                          </div>
                        )}
                        <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tuyến đi</p>
                          <p className="mt-1 font-semibold text-slate-900 truncate" title={item.activity.pickupLocation && item.activity.dropoffLocation ? `${item.activity.pickupLocation} → ${item.activity.dropoffLocation}` : item.activity.description}>
                            {item.activity.pickupLocation && item.activity.dropoffLocation
                              ? `${item.activity.pickupLocation} → ${item.activity.dropoffLocation}`
                              : item.activity.description || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>

                      {/* Current Assignments */}
                      {item.activity.transportAssignments && item.activity.transportAssignments.length > 0 && (
                        <div className="relative z-10 mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex size-6 items-center justify-center rounded-full bg-indigo-200/50 text-indigo-700">
                              <Icon icon="heroicons:truck" className="size-3.5" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-900">Đã phân công</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {item.activity.transportAssignments.map((ta) => (
                              <div key={ta.id} className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-sm border border-indigo-100/50">
                                <span className="text-sm font-bold text-slate-900">{ta.vehicleType || "Chưa chọn xe"}</span>
                                <span className="text-xs font-medium text-slate-500">{ta.driverName || "Chưa chọn tài xế"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activityErrors[item.activity.id] && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative z-10 mt-4 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          <div className="flex items-start gap-3">
                            <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 text-rose-500" />
                            <div className="flex-1">
                              <p className="font-bold">Thao tác thất bại</p>
                              <p className="mt-1">{activityErrors[item.activity.id]}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(activeApproveItem)}
        onClose={() => setApproveActivityId(null)}
        title={t("tourInstance.transport.approveModal", "Gan xe va duyet")}
        footerContent={(
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setApproveActivityId(null)}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t("common.cancel", "Huy")}
            </button>
            <button
              type="button"
              onClick={handleApproveActivity}
              disabled={
                !approveModalValidation.hasFilledRow
                || approveModalValidation.duplicateVehicle
                || approveModalValidation.duplicateDriver
                || approveModalValidation.typeMismatch
                || approveModalValidation.seatShortfall
                || approveModalValidation.countMismatch
                || actionKey === `approve:${approveActivityId}`
              }
              className="flex-1 sm:flex-none rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {actionKey === `approve:${approveActivityId}`
                ? t("common.processing", "Dang xu ly...")
                : t("tourInstance.transport.approveAction", "Gan xe va duyet")}
            </button>
          </div>
        )}
      >
        {activeApproveItem && (
          <div className="space-y-6 pt-2">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {`Day ${activeApproveItem.dayNumber} • ${activeApproveItem.dayTitle}`}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 leading-tight">
                {activeApproveItem.activity.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {formatDateLabel(activeApproveItem.date)}
              </p>
            </div>

            <div className="space-y-4">
              {approveActivityId && !availableVehiclesLoading && availableVehiclesByActivity[approveActivityId] && availableVehiclesByActivity[approveActivityId].length === 0 && (
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <Icon icon="heroicons:exclamation-triangle" className="mt-0.5 size-5 shrink-0 text-amber-500" />
                  <p className="font-medium leading-relaxed">
                    {t("tourInstance.transport.noAvailableVehicles", "Không có xe nào khả dụng vào ngày này. Tất cả xe đã được đặt hết.")}
                  </p>
                </div>
              )}

              {approveModalValidation.duplicateDriver && (
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <Icon icon="heroicons:exclamation-triangle" className="mt-0.5 size-5 shrink-0 text-amber-500" />
                  <p className="font-medium leading-relaxed">
                    {t("tourInstance.transport.duplicateDriver", "Lỗi: Không thể gán một tài xế cho nhiều xe trong cùng một hoạt động.")}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {approveDraft.rows.map((row, rowIndex) => (
                  <motion.div
                    key={rowIndex}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid gap-4 overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-start"
                  >
                    <Select
                      label={t("tourInstance.transport.vehicle", "Xe")}
                      value={row.vehicleId}
                      onChange={(event) => patchRow(activeApproveItem.activity.id, rowIndex, { vehicleId: event.target.value })}
                      options={approveVehicleOptions}
                      placeholder={availableVehiclesLoading ? "Đang tải xe…" : "Chọn xe trống"}
                      disabled={availableVehiclesLoading || Boolean(activeApproveItem.activity.transportAssignments?.[rowIndex]?.vehicleId || (rowIndex === 0 && activeApproveItem.activity.vehicleId))}
                    />
                    <Select
                      label={t("tourInstance.transport.driver", "Tai xe")}
                      value={row.driverId}
                      onChange={(event) => patchRow(activeApproveItem.activity.id, rowIndex, { driverId: event.target.value })}
                      options={approveDriverOptions}
                      placeholder={availableDriversLoading ? "Đang tải tài xế…" : "Chọn tài xế"}
                      disabled={availableDriversLoading}
                    />
                    <div className="flex justify-end pt-1 md:pt-7">
                      {approveDraft.rows.length > 1 && (!approveModalValidation.requestedCount || approveDraft.rows.length > approveModalValidation.requestedCount) && (
                        <button
                          type="button"
                          onClick={() => removeAssignmentRow(activeApproveItem.activity.id, rowIndex)}
                          className="flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Icon icon="heroicons:trash" className="size-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {(!approveModalValidation.requestedCount || approveDraft.rows.length < approveModalValidation.requestedCount) && (
                <button
                  type="button"
                  onClick={() => addAssignmentRow(activeApproveItem.activity.id)}
                  disabled={approveModalValidation.requestedCount !== undefined && approveDraft.rows.length >= approveModalValidation.requestedCount}
                  className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 pl-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-indigo-100">
                    <Icon icon="heroicons:plus" className="size-4" />
                  </div>
                  {t("tourInstance.transport.addVehicleRow", "Thêm xe")}
                </button>
              )}

              {approveModalValidation.requestedCount !== undefined && (
                <p className={`text-xs font-semibold px-2 ${approveModalValidation.countMismatch ? "text-rose-600" : "text-slate-500"}`}>
                  {t("tourInstance.transport.vehicleCountStatus", "{{filled}}/{{required}} xe", { filled: approveModalValidation.filledCount, required: approveModalValidation.requestedCount })}
                </p>
              )}
            </div>

            <div className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-5 border border-slate-100 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại xe yêu cầu</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeApproveItem.activity.requestedVehicleType || "Chưa chọn"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ghế yêu cầu</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeApproveItem.activity.requestedSeatCount ?? tour.maxParticipation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ghế đã chọn</p>
                <p className={`mt-1 text-sm font-semibold ${approveModalValidation.seatShortfall ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {approveModalValidation.totalSeats}
                </p>
              </div>
            </div>

            {(approveModalValidation.typeMismatch || approveModalValidation.seatShortfall || approveModalValidation.duplicateVehicle) && (
              <div className="space-y-2">
                <div role="alert" className="space-y-1.5 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {approveModalValidation.duplicateVehicle && <p className="font-medium">• Không được chọn trùng xe.</p>}
                  {approveModalValidation.typeMismatch && <p className="font-medium">• Cần xe loại {activeApproveItem?.activity.requestedVehicleType}.</p>}
                  {approveModalValidation.seatShortfall && <p className="font-medium">• Chưa đủ số ghế (cần {activeApproveItem?.activity.requestedSeatCount ?? tour?.maxParticipation ?? 0}).</p>}
                </div>
                <div className="px-2 text-xs">
                  <a href="mailto:manager@example.com" className="text-indigo-600 font-medium hover:underline">
                    Liên hệ manager để đổi yêu cầu
                  </a>
                </div>
              </div>
            )}

            <Textarea
              label={t("tourInstance.transport.note", "Ghi chu")}
              value={approveDraft.note}
              onChange={(event) => updateDraft(activeApproveItem.activity.id, { note: event.target.value })}
              placeholder={t("tourInstance.transport.notePlaceholder", "Them ghi chu cho yeu cau nay (neu can)")}
              row={3}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(activeRejectItem)}
        onClose={() => setRejectActivityId(null)}
        title={t("tourInstance.transport.rejectModal", "Tu choi yeu cau van chuyen")}
        footerContent={(
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setRejectActivityId(null)}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t("common.cancel", "Huy")}
            </button>
            <button
              type="button"
              onClick={handleRejectActivity}
              disabled={actionKey === `reject:${rejectActivityId}`}
              className="flex-1 sm:flex-none rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {actionKey === `reject:${rejectActivityId}`
                ? t("common.processing", "Dang xu ly...")
                : t("tourInstance.transport.reject", "Tu choi")}
            </button>
          </div>
        )}
      >
        {activeRejectItem && (
          <div className="space-y-6 pt-2">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {`Day ${activeRejectItem.dayNumber} • ${activeRejectItem.dayTitle}`}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 leading-tight">
                {activeRejectItem.activity.title}
              </h3>
            </div>

            <Textarea
              label={t("tourInstance.transport.note", "Ghi chu")}
              value={rejectDraft.note}
              onChange={(event) => updateDraft(activeRejectItem.activity.id, { note: event.target.value })}
              placeholder={t("tourInstance.transport.rejectReasonPlaceholder", "Nhap ly do tu choi (bat buoc)")}
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
    </div>
  );
}
