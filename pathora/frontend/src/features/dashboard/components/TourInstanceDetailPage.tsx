"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { cn } from "@/lib/cn";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  UpdateTourInstancePayload,
  tourInstanceService,
} from "@/api/services/tourInstanceService";
import { bookingService } from "@/api/services/bookingService";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import { userService } from "@/api/services/userService";
import {
  isExternalOnlyTransportation,
  NormalizedTourInstanceDto,
  type TourInstanceDayActivityDto,
} from "@/types/tour";
import { UserInfo } from "@/types";
import { handleApiError } from "@/utils/apiResponse";
import {
  getApprovalAppearance,
  normalizeApprovalStatus,
} from "@/utils/approvalStatusHelper";
import {
  StatCard,
  TeamSection,
  InfoRow,
  formatCurrency,
  formatDate,
  toDateInput,
} from "./tour-instance/ViewComponents";
import SupplierReassignmentModal from "./SupplierReassignmentModal";
import TicketImageUpload, { type TicketImageBookingOption } from "./TicketImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { PrivateTourCoDesignOperatorSection } from "@/features/private-co-design/PrivateTourCoDesignOperatorSection";
import PublicTourBookingAssignmentPanel from "./PublicTourBookingAssignmentPanel";
import type { BookingTicketEntry } from "./ExternalTicketAssignmentPanel";


type EditForm = {
  title: string;
  instanceType: string;
  startDate: string;
  endDate: string;
  maxParticipation: string;
  basePrice: string;
  location: string;
  confirmationDeadline: string;
  includedServices: string[];
  guideUserIds: string[];
  managerUserIds: string[];
  thumbnailUrl: string;
  imageUrls: string[];
};

const inputClassName =
  "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

type ApprovalSummary = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  unassigned: number;
};

const isTransportationActivity = (activityType?: string | null) => {
  const normalized = activityType?.trim().toLowerCase();
  return normalized === "transportation" || normalized === "7";
};

const isAccommodationActivity = (activityType?: string | null) => {
  const normalized = activityType?.trim().toLowerCase();
  return normalized === "accommodation" || normalized === "8";
};

// normalizeApprovalStatus and getApprovalAppearance imported from @/utils/approvalStatusHelper

const buildApprovalSummary = (
  items: Array<{ assigned: boolean; status?: string | null }>,
): ApprovalSummary =>
  items.reduce(
    (summary, item) => {
      summary.total += 1;

      if (!item.assigned) {
        summary.unassigned += 1;
        return summary;
      }

      switch (normalizeApprovalStatus(item.status)) {
        case "approved":
          summary.approved += 1;
          break;
        case "rejected":
          summary.rejected += 1;
          break;
        default:
          summary.pending += 1;
          break;
      }

      return summary;
    },
    {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      unassigned: 0,
    },
  );

const toEditForm = (data: NormalizedTourInstanceDto): EditForm => ({
  title: data.title ?? "",
  instanceType: data.instanceType?.toLowerCase() === "private" ? "1" : "2",
  startDate: toDateInput(data.startDate),
  endDate: toDateInput(data.endDate),
  maxParticipation: String(data.maxParticipation ?? 0),
  basePrice: String(data.basePrice ?? 0),
  location: data.location ?? "",
  confirmationDeadline: toDateInput(data.confirmationDeadline),
  includedServices: data.includedServices ?? [],
  guideUserIds: (data.managers ?? [])
    .filter((m) => m.role === "Guide")
    .map((m) => m.userId),
  managerUserIds: (data.managers ?? [])
    .filter((m) => m.role === "Manager")
    .map((m) => m.userId),
  thumbnailUrl: data.thumbnail?.publicURL ?? "",
  imageUrls: (data.images ?? [])
    .map((image) => image.publicURL ?? "")
    .filter(Boolean),
});

/* (TourStatusBadge imported from @/components/ui) */

type InstanceDetailDataState = "loading" | "ready" | "error";

/* ── Manager Review Panel (used when status = PendingManagerReview) ──── */
function ManagerReviewPanel({ instanceId, onAction }: { instanceId: string; onAction: () => void }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    setError(null);
    setSuccess(null);
    try {
      await tourInstanceService.managerApproveItinerary(instanceId);
      setSuccess("Lịch trình đã được duyệt. Tour đang chờ khách hàng xác nhận.");
      onAction();
    } catch (err: unknown) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Không thể duyệt lịch trình.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) {
      setError("Vui lòng nhập ghi chú điều chỉnh trước khi gửi.");
      return;
    }
    setLoading("reject");
    setError(null);
    setSuccess(null);
    try {
      await tourInstanceService.managerRejectItinerary(instanceId, note.trim());
      setSuccess("Lịch trình đã bị trả lại. Tour Operator sẽ nhận được ghi chú của bạn.");
      setNote("");
      onAction();
    } catch (err: unknown) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Không thể gửi yêu cầu điều chỉnh.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <article className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          <Icon icon="heroicons:clipboard-document-check" className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900">Duyệt lịch trình</h3>
          <p className="text-xs text-stone-500">Tour Operator đã hoàn thiện lịch trình. Xem xét và duyệt hoặc yêu cầu điều chỉnh.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="heroicons:check-circle" className="size-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="heroicons:exclamation-triangle" className="size-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Note textarea */}
      <div>
        <label htmlFor="manager-review-note" className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
          Ghi chú điều chỉnh (bắt buộc khi yêu cầu điều chỉnh)
        </label>
        <textarea
          id="manager-review-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Cần bổ sung hoạt động buổi tối ngày 2, điều chỉnh giá vận chuyển..."
          rows={3}
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        >
          {loading === "approve" ? (
            <><Icon icon="heroicons:arrow-path" className="size-4 animate-spin" /> Đang xử lý...</>
          ) : (
            <><Icon icon="heroicons:check-circle" className="size-4" /> Duyệt lịch trình</>
          )}
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-200 bg-white text-orange-600 text-sm font-semibold transition-all hover:bg-orange-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200"
        >
          {loading === "reject" ? (
            <><Icon icon="heroicons:arrow-path" className="size-4 animate-spin" /> Đang xử lý...</>
          ) : (
            <><Icon icon="heroicons:arrow-uturn-left" className="size-4" /> Yêu cầu điều chỉnh</>
          )}
        </button>
      </div>
    </article>
  );
}

export interface TourInstanceDetailPageProps {
  readOnly?: boolean;
}

export default function TourInstanceDetailPage({ readOnly = false }: TourInstanceDetailPageProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [dataState, setDataState] = useState<InstanceDetailDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [dayEditForm, setDayEditForm] = useState<Record<string, { title: string; description: string; actualDate: string; startTime: string; endTime: string; note: string }>>({});
  const [activityEditForm, setActivityEditForm] = useState<Record<string, { note: string; startTime: string; endTime: string; isOptional: boolean }>>({});
  const [addingActivityForDayId, setAddingActivityForDayId] = useState<string | null>(null);
  const [newActivityForm, setNewActivityForm] = useState({ title: "", activityType: 0, description: "", note: "", startTime: "", endTime: "", isOptional: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [newDayForm, setNewDayForm] = useState({
    title: "",
    actualDate: "",
    description: "",
  });

  // Supplier reassignment modal state (task 3.10)
  const { user } = useAuth();
  const isManager = user?.roles?.some((r) => r.name === "Admin" || r.name === "Manager");
  const canReassign = !readOnly && user?.roles?.some(
    (r) => r.name === "Admin" || r.name === "Manager" || r.name === "TourOperator",
  );
  const canEditItinerary = !readOnly && user?.roles?.some(
    (r) => r.name === "Admin" || r.name === "TourOperator",
  );

  // Public tour per-booking assignment state
  const [publicTourBookings, setPublicTourBookings] = useState<AdminBookingListResponse[]>([]);
  const [publicTourBookingsLoading, setPublicTourBookingsLoading] = useState(false);

  const hasAssignedOperator = useMemo(() => {
    if (data?.instanceType?.toLowerCase() === "private") return true;
    const managerRoles = data?.managers?.filter((m) => m.role === "Manager") || [];
    return managerRoles.length > 1; // Assuming 1 manager is the system, >1 means assigned
  }, [data?.managers, data?.instanceType]);

  const [reassignActivity, setReassignActivity] = useState<TourInstanceDayActivityDto | null>(null);
  const [reassignType, setReassignType] = useState<"Transportation" | "Accommodation">("Transportation");
  const [ticketBookingOptions, setTicketBookingOptions] = useState<TicketImageBookingOption[]>([]);
  const [ticketBookingOptionsLoading, setTicketBookingOptionsLoading] = useState(false);
  const [primaryPrivateBookingId, setPrimaryPrivateBookingId] = useState<string | null>(null);

  // Operator Assignment Modal State
  const [tourOperators, setTourOperators] = useState<UserInfo[]>([]);
  const [showAssignOperatorModal, setShowAssignOperatorModal] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [assigningOperator, setAssigningOperator] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingInstance, setCancellingInstance] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Check if navigated from creation and try to reuse POST response
  useEffect(() => {
    // Try to read full POST response from sessionStorage first
    try {
      const stored = sessionStorage.getItem("tourInstanceCreated");
      if (stored) {
        // New format: full TourInstanceDto as JSON string
        const parsed = JSON.parse(stored) as NormalizedTourInstanceDto;
        if (parsed && parsed.id === id) {
          setData(parsed);
          setForm(toEditForm(parsed));
          setShowCreatedBanner(true);
          setDataState("ready");
          sessionStorage.removeItem("tourInstanceCreated");
          // Auto-dismiss after 5 seconds
          const timer = setTimeout(() => setShowCreatedBanner(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Fall through to GET request
    }
  }, [id]);

  const approvalSummary = useMemo(() => {
    const activities = (data?.days ?? []).flatMap((day) => day.activities ?? []);

    return {
      transport: buildApprovalSummary(
        activities
          .filter((activity) => isTransportationActivity(activity.activityType))
          .map((activity) => ({
            assigned: Boolean(
              activity.transportSupplierId || activity.transportSupplierName,
            ),
            status: activity.transportationApprovalStatus,
          })),
      ),
      accommodation: buildApprovalSummary(
        activities
          .filter((activity) => isAccommodationActivity(activity.activityType))
          .map((activity) => ({
            assigned: Boolean(
              activity.accommodation?.supplierId
                || activity.accommodation?.supplierName,
            ),
            status: activity.accommodation?.supplierApprovalStatus,
          })),
      ),
    };
  }, [data]);

  const availableGuides = useMemo(
    () => allUsers.filter((u) => u.roles?.some((r) => r.name === "TourGuide")),
    [allUsers],
  );

  const availableManagers = useMemo(
    () => allUsers.filter((u) => u.roles?.some((r) => r.name === "Manager" || r.name === "TourOperator" || r.name === "Admin")),
    [allUsers],
  );

  const selectedGuides = useMemo(
    () => allUsers.filter((u) => (form?.guideUserIds ?? []).includes(u.id)),
    [allUsers, form?.guideUserIds],
  );

  const selectedManagers = useMemo(
    () => allUsers.filter((u) => (form?.managerUserIds ?? []).includes(u.id)),
    [allUsers, form?.managerUserIds],
  );

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setForm(detail ? toEditForm(detail) : null);
      setDataState("ready");
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, t("tourInstance.fetchError", "Failed to load tour instance details")),
      );
      setData(null);
      setForm(null);
      setDataState("error");
      setErrorMessage(apiError.message);
    }
  }, [id, t]);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await userService.getAll(undefined, 1, 100);
      setAllUsers(users ?? []);
    } catch {
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    // Skip if data was already loaded from sessionStorage
    if (dataState !== "loading") return;
    let active = true;
    const doLoad = async () => {
      try {
        setErrorMessage(null);
        const detail = await tourInstanceService.getInstanceDetail(id);
        if (!active) return;
        setData(detail);
        setForm(detail ? toEditForm(detail) : null);
        setDataState("ready");
      } catch (error: unknown) {
        if (!active) return;
        const apiError = handleApiError(error);
        toast.error(
          t(apiError.message, t("tourInstance.fetchError", "Failed to load tour instance details")),
        );
        setData(null);
        setForm(null);
        setDataState("error");
        setErrorMessage(apiError.message);
      }
    };
    void doLoad();
    return () => {
      active = false;
    };
  }, [id, t, reloadToken, dataState]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load bookings for public tour per-booking assignment panel
  useEffect(() => {
    if (!data?.id || data.instanceType?.toLowerCase() !== "public") {
      setPublicTourBookings([]);
      return;
    }
    let active = true;
    setPublicTourBookingsLoading(true);
    void (async () => {
      try {
        const bookings = await bookingService.getBookingsByTourInstance(data.id);
        if (active) setPublicTourBookings(bookings.filter((b) => b.status !== "Cancelled"));
      } catch {
        if (active) setPublicTourBookings([]);
      } finally {
        if (active) setPublicTourBookingsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [data?.id, data?.instanceType]);

  useEffect(() => {
    if (!data?.id || data.instanceType?.toLowerCase() !== "private" || !canReassign) {
      setPrimaryPrivateBookingId(null);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const bookings = await bookingService.getBookingsByTourInstance(data.id);
        if (!active) return;
        const first = bookings[0];
        const bid = first?.id ?? (first as { bookingId?: string } | undefined)?.bookingId ?? null;
        setPrimaryPrivateBookingId(bid);
      } catch {
        if (active) setPrimaryPrivateBookingId(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [data?.id, data?.instanceType, canReassign]);

  useEffect(() => {
    if (!data?.id || (data.totalBookings ?? 0) <= 0) {
      setTicketBookingOptions([]);
      setTicketBookingOptionsLoading(false);
      return;
    }

    let active = true;
    setTicketBookingOptionsLoading(true);

    const loadBookings = async () => {
      try {
        const bookings = await bookingService.getBookingsByTourInstance(data.id);
        if (!active) return;
        setTicketBookingOptions(
          bookings
            .map((booking) => {
              const id = booking.id || (booking as { bookingId?: string }).bookingId;
              if (!id) return null;
              return {
                id,
                label: `${booking.customerName} - ${booking.status}`,
              };
            })
            .filter((option): option is TicketImageBookingOption => option !== null),
        );
      } catch {
        if (active) setTicketBookingOptions([]);
      } finally {
        if (active) setTicketBookingOptionsLoading(false);
      }
    };

    void loadBookings();
    return () => {
      active = false;
    };
  }, [data?.id, data?.totalBookings]);

  const updateField = <K extends keyof EditForm>(field: K, value: EditForm[K]) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  };

  const updateListItem = (
    field: "includedServices" | "imageUrls",
    index: number,
    value: string,
  ) => {
    setForm((current) => {
      if (!current) return current;
      const items = [...current[field]];
      items[index] = value;
      return { ...current, [field]: items };
    });
  };

  const appendListItem = (field: "includedServices" | "imageUrls") => {
    setForm((current) => {
      if (!current) return current;
      return { ...current, [field]: [...current[field], ""] };
    });
  };

  const removeListItem = (
    field: "includedServices" | "imageUrls",
    index: number,
  ) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const toggleUser = (
    userId: string,
    field: "guideUserIds" | "managerUserIds",
  ) => {
    setForm((current) => {
      if (!current) return current;
      const currentIds = current[field];
      const next = currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId];
      return { ...current, [field]: next };
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditDay = (day: any) => {
    setEditingDayId(day.id);
    setEditingActivityId(null);
    setDayEditForm({
      title: day.title ?? "",
      description: day.description ?? "",
      actualDate: day.actualDate ? day.actualDate.split("T")[0] : "",
      startTime: day.startTime ?? "",
      endTime: day.endTime ?? "",
      note: day.note ?? "",
    });
  };

  const cancelEditDay = () => {
    setEditingDayId(null);
    setDayEditForm({});
  };

  const saveDay = async () => {
    if (!data || !editingDayId) return;
    const f = dayEditForm[editingDayId];
    if (!f) return;

    try {
      // Validate startTime < endTime when both are provided
      if (f.startTime && f.endTime && f.startTime >= f.endTime) {
        toast.error(t("tourInstance.validation.startTimeBeforeEndTime", "Giờ bắt đầu phải trước giờ kết thúc"));
        return;
      }
      const updated = await tourInstanceService.updateInstanceDay(data.id, editingDayId, {
        title: f.title,
        description: f.description || null,
        actualDate: f.actualDate ? f.actualDate + "T00:00:00Z" : "",
        startTime: f.startTime || null,
        endTime: f.endTime || null,
        note: f.note || null,
      });
      if (updated) {
        toast.success(t("tourInstance.dayUpdated", "Day updated successfully"));
        setEditingDayId(null);
        setDayEditForm({});
        await loadData();
      }
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditActivity = (dayId: string, activity: any) => {
    setEditingDayId(dayId);
    setEditingActivityId(activity.id);
    setActivityEditForm({
      note: activity.note ?? "",
      startTime: activity.startTime ?? "",
      endTime: activity.endTime ?? "",
      isOptional: activity.isOptional ?? false,
    });
  };

  const cancelEditActivity = () => {
    setEditingActivityId(null);
    setActivityEditForm({});
  };

  const saveActivity = async () => {
    if (!data || !editingDayId || !editingActivityId) return;
    const f = activityEditForm[editingActivityId];
    if (!f) return;

    try {
      const updated = await tourInstanceService.updateInstanceActivity(
        data.id,
        editingDayId,
        editingActivityId,
        {
          note: f.note || null,
          startTime: f.startTime || null,
          endTime: f.endTime || null,
          isOptional: f.isOptional,
        },
      );
      if (updated) {
        toast.success(t("tourInstance.activityUpdated", "Activity updated successfully"));
        setEditingActivityId(null);
        setActivityEditForm({});
        await loadData();
      }
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    }
  };

  const saveNewDay = async () => {
    if (!data) return;
    if (!newDayForm.title.trim()) {
      toast.error(t("tourInstance.validation.titleRequired", "Title is required"));
      return;
    }
    if (!newDayForm.actualDate) {
      toast.error(t("tourInstance.validation.actualDateRequired", "Actual date is required"));
      return;
    }
    // Validate actualDate within instance date range
    if (data.startDate && data.endDate) {
      const startDate = data.startDate.split("T")[0];
      const endDate = data.endDate.split("T")[0];
      if (newDayForm.actualDate < startDate || newDayForm.actualDate > endDate) {
        toast.error(t("tourInstance.validation.dateOutOfRange", "Ngày thực tế phải nằm trong khoảng ngày bắt đầu và kết thúc của tour"));
        return;
      }
    }
    try {
      await tourInstanceService.addCustomDay(data.id, {
        title: newDayForm.title.trim(),
        actualDate: newDayForm.actualDate + "T00:00:00Z",
        description: newDayForm.description.trim() || undefined,
      });
      toast.success(t("tourInstance.dayAdded", "Day added successfully"));
      setAddingDay(false);
      setNewDayForm({ title: "", actualDate: "", description: "" });
      await loadData();
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    }
  };

  const saveNewActivity = async (dayId: string) => {
    if (!data) return;
    if (!newActivityForm.title.trim()) {
      toast.error(t("tourInstance.validation.titleRequired", "Title is required"));
      return;
    }
    try {
      await tourInstanceService.createInstanceActivity(data.id, dayId, {
        title: newActivityForm.title.trim(),
        activityType: newActivityForm.activityType,
        description: newActivityForm.description.trim() || null,
        note: newActivityForm.note.trim() || null,
        startTime: newActivityForm.startTime || null,
        endTime: newActivityForm.endTime || null,
        isOptional: newActivityForm.isOptional,
      });
      toast.success(t("tourInstance.activityAdded", "Activity added successfully"));
      setAddingActivityForDayId(null);
      setNewActivityForm({ title: "", activityType: 0, description: "", note: "", startTime: "", endTime: "", isOptional: false });
      await loadData();
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    }
  };

  const handleDeleteActivity = async (dayId: string, activityId: string) => {
    if (!data) return;
    if (!confirm(t("common.confirmDelete", "Are you sure you want to delete this?"))) return;
    
    try {
      await tourInstanceService.deleteInstanceActivity(data.id, dayId, activityId);
      toast.success(t("tourInstance.activityDeleted", "Activity deleted successfully"));
      await loadData();
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    }
  };

  const handleCancelEdit = () => {
    if (!data) return;
    setForm(toEditForm(data));
    setErrors({});
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!data || !form) return;

    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      newErrors.title = t(
        "tourInstance.validation.titleRequired",
        "Title is required",
      );
    }
    if (!form.startDate) {
      newErrors.startDate = t(
        "tourInstance.validation.startDateRequired",
        "Start date is required",
      );
    }
    if (!form.endDate) {
      newErrors.endDate = t(
        "tourInstance.validation.endDateRequired",
        "End date is required",
      );
    }
    if (!form.maxParticipation || Number(form.maxParticipation) <= 0) {
      newErrors.maxParticipation = t(
        "tourInstance.validation.maxParticipantsRequired",
        "Maximum participants must be greater than 0",
      );
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t("tourInstance.validationFailed", "Please fill in all required fields"));
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const includedServices = form.includedServices
        .map((service) => service.trim())
        .filter(Boolean);
      const imageUrls = form.imageUrls
        .map((url) => url.trim())
        .filter(Boolean);

      const payload: UpdateTourInstancePayload = {
        id: data.id,
        title: form.title.trim(),
        instanceType: Number(form.instanceType),
        startDate: form.startDate + "T00:00:00Z",
        endDate: form.endDate + "T00:00:00Z",
        maxParticipation: Number(form.maxParticipation),
        basePrice: Number(form.basePrice) || 0,
        location: form.location.trim() || undefined,
        confirmationDeadline: form.confirmationDeadline
          ? form.confirmationDeadline + "T00:00:00Z"
          : undefined,
        includedServices:
          includedServices.length > 0 ? includedServices : undefined,
        guideUserIds: form.guideUserIds,
        managerUserIds: form.managerUserIds,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      await tourInstanceService.updateInstance(payload);
      toast.success(
        t("tourInstance.updated", "Tour instance updated successfully!"),
      );

      await loadData();
      setIsEditing(false);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      const isConflict = (error as { response?: { status?: number } })?.response?.status === 409
        || apiError.code === "TourInstance.ConcurrencyConflict";
      if (isConflict) {
        toast.error(
          t(
            "tourInstance.concurrencyConflict.message",
            "This tour instance was modified by another user. Please refresh and try again.",
          ),
        );
        await loadData();
      } else {
        toast.error(
          t(apiError.message, "Failed to update tour instance"),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (dataState === "loading") {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-[1440px] space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <SkeletonCard />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard lines={6} />
            <SkeletonCard lines={6} />
          </div>
        </div>
      </main>
    );
  }

  if (dataState === "error" || !data || !form) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <Icon
            icon="heroicons:exclamation-circle"
            className="mx-auto mb-2 size-10 text-stone-400"
          />
          <p className="text-base font-semibold text-stone-900">
            {dataState === "error"
              ? t(
                "tourInstance.form.error.title",
                "Could not load tour instance",
              )
              : t("tourInstance.notFound", "Tour instance not found")}
          </p>
          {dataState === "error" && errorMessage && (
            <p className="mt-2 text-sm text-stone-500">{errorMessage}</p>
          )}
          <div className="mt-4 gap-3 center">
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 active:scale-[0.98]">
              {t("common.retry", "Retry")}
            </button>
            <Link
              href="/manager/tour-instances"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 transition-all hover:text-orange-600 active:-translate-y-[1px]">
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t(
                "tourInstance.backToInstances",
                "Back to Tour Instances",
              )}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="p-6 pb-32 spacer outline-none md:p-8">
      {showCreatedBanner && (
        <div className="mx-auto max-w-[1440px] mb-4">
          <div className="items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm h-stack">
            <div className="items-center gap-2 h-stack">
              <Icon icon="heroicons:check-circle" className="size-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {t("tourInstance.createdBanner.title", "Tour instance created successfully!")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreatedBanner(false)}
              className="text-emerald-600 transition-colors hover:text-emerald-800"
              aria-label={t("tourInstance.createdBanner.dismiss", "Dismiss")}
            >
              <Icon icon="heroicons:x-mark" className="size-4" />
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1440px] gap-6 v-stack">
        <header className="rounded-2xl border border-stone-200 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden relative v-stack md:flex-row">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push(isManager ? "/manager/tour-instances" : "/tour-operator/custom-tour-requests");
              }
            }}
            className="absolute top-4 left-4 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-stone-600 shadow-sm border border-stone-200/50 transition-all hover:bg-white hover:text-stone-900">
            <Icon icon="heroicons:arrow-left" className="size-4" />
          </button>

          {data.thumbnail?.publicURL ? (
            <div className="relative w-full shrink-0 bg-stone-100 md:w-80 lg:w-96">
              <img src={data.thumbnail.publicURL} alt={data.title} className="h-full w-full object-cover min-h-[200px]" />
            </div>
          ) : (
            <div className="relative w-full shrink-0 bg-stone-100 min-h-[200px] border-r border-stone-200 center md:w-80 lg:w-96">
              <Icon icon="heroicons:photo" className="size-10 text-stone-300" />
            </div>
          )}

          <div className="p-6 spacer justify-between v-stack md:p-8">
            <div className="flex-wrap items-start justify-between gap-4 h-stack">
              <div className="space-y-1.5 mt-6 md:ml-6 md:mt-0">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">{data.title}</h1>
                <p className="text-sm font-medium text-stone-500 flex-wrap items-center gap-2 h-stack">
                  <span className="text-stone-700 font-semibold">{data.tourInstanceCode}</span>
                  <span className="text-stone-300">&bull;</span>
                  <span>{data.tourName}</span>
                  <span className="text-stone-300">&bull;</span>
                  <span>{data.classificationName}</span>
                </p>
              </div>

              <div className="items-center gap-3 w-full justify-start h-stack sm:w-auto sm:justify-end">
                <TourStatusBadge status={data.status} />
                {!readOnly && (
                  <>
                    {isManager && !hasAssignedOperator ? (
                      <button
                        type="button"
                        onClick={() => setShowAssignOperatorModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 active:scale-[0.98] focus:ring-2 focus:ring-orange-500/20">
                        <Icon icon="heroicons:user-plus" className="size-4" />
                        {t("tourInstance.assignOperator", "Assign Operator")}
                      </button>
                    ) : isManager ? null : (
                  !isEditing ? (
                    <>
                      {/* Operator Actions for their assigned custom tours */}
                      {data.instanceType?.toLowerCase() === "private" && (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]">
                          <Icon icon="heroicons:x-circle" className="size-4" />
                          {t("tourInstance.cancelTour", "Cancel Tour")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98] focus:ring-2 focus:ring-stone-900/20">
                        <Icon icon="heroicons:pencil-square" className="size-4" />
                        {t("tourInstance.edit", "Edit")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:bg-stone-100 active:scale-[0.98]">
                        {t("tourInstance.cancel", "Cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]">
                        <Icon icon="heroicons:check" className="size-4" />
                        {saving
                          ? t("common.saving", "Saving...")
                          : t("common.save", "Save")}
                      </button>
                    </>
                  )
                )}
                </>
              )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-stone-100 flex-wrap gap-3 h-stack">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 border border-stone-200/60">
                <Icon icon="heroicons:clock" className="size-4 text-stone-400" />
                {data.durationDays || 0} {t("tourInstance.days", "days")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 border border-stone-200/60">
                <Icon icon="heroicons:globe-americas" className="size-4 text-stone-400" />
                {data.instanceType}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600 border border-stone-200/60">
                <Icon icon="heroicons:map-pin" className="size-4 text-stone-400" />
                {data.location || "—"}
              </span>
            </div>
          </div>
        </header>

        {/* ── Manager Review Panel (PendingManagerReview + readOnly/manager) ─── */}
        {readOnly && isManager && data.status?.toLowerCase() === "pendingmanagerreview" && (
          <ManagerReviewPanel instanceId={data.id} onAction={() => setReloadToken((v) => v + 1)} />
        )}

        {/* ── Manager Review Note (visible to Tour Operator when PendingAdjustment) ─── */}
        {!readOnly && data.managerReviewNote && (
          <article className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Icon icon="heroicons:chat-bubble-oval-left-ellipsis" className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-900">Ghi chú từ Manager</h3>
                <p className="text-xs text-orange-600">Vui lòng điều chỉnh lịch trình theo hướng dẫn bên dưới</p>
              </div>
            </div>
            <div className="bg-white border border-orange-100 rounded-xl p-4">
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{data.managerReviewNote}</p>
            </div>
          </article>
        )}

        {!isEditing ? (
          <>
            {/* STATS SECTION */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("tourInstance.participants", "Participants")} value={`${data.currentParticipation} / ${data.maxParticipation}`}>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, Math.round((data.currentParticipation / Math.max(data.maxParticipation, 1)) * 100))}%` }} />
                </div>
              </StatCard>
              <StatCard label={t("tourInstance.basePrice", "Base Price")} value={formatCurrency(data.basePrice)} accent="text-orange-600" />
              <StatCard label={t("tourInstance.totalBookings", "Total Bookings")} value={data.totalBookings} />
              <StatCard label={t("tourInstance.revenueLabel", "Revenue")} value={formatCurrency(data.revenue || 0)} accent="text-emerald-600" />
            </section>

            {/* MAIN CONTENT GRID */}
            <section className="grid gap-6 lg:grid-cols-[7fr_5fr]">
              {/* LEFT COLUMN: Info & Media */}
              <div className="space-y-6">
                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-5 pb-3 border-b border-stone-100">
                    {t("tourInstance.tourInformation", "Tour Information")}
                  </h2>
                  <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <InfoRow label={t("tourInstance.startDate", "Start Date")} value={formatDate(data.startDate)} />
                      <InfoRow label={t("tourInstance.endDate", "End Date")} value={formatDate(data.endDate)} />
                      <InfoRow label={t("tourInstance.confirmationDeadline", "Confirmation Deadline")} value={formatDate(data.confirmationDeadline)} />
                    </div>
                  </div>

                  {data.includedServices && data.includedServices.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-stone-100">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">
                        {t("tourInstance.includedServices", "Included Services")}
                      </h3>
                      <div className="flex-wrap gap-2.5 h-stack">
                        {data.includedServices.map((service) => (
                          <span key={service} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100/60 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                            <Icon icon="heroicons:check" className="size-3.5 text-emerald-500" />
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>

                {data.images && data.images.length > 0 && (
                  <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 pb-3 border-b border-stone-100">
                      {t("tourInstance.form.media", "Media")}
                    </h2>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                      {data.images.map((img, i) => (
                        <div key={i} className="aspect-[4/3] rounded-xl border border-stone-200/60 overflow-hidden bg-stone-100 group relative">
                          <img src={img.publicURL || ""} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  </article>
                )}
              </div>

              {/* RIGHT COLUMN: Providers & Team */}
              <div className="space-y-6">
                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 border-b border-stone-100 pb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
                    {t("tourInstance.approvalOverview", "Approval Overview")}
                  </h2>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                      <div className="items-center gap-2 h-stack">
                        <Icon icon="heroicons:truck" className="size-4 text-cyan-600" />
                        <h3 className="text-sm font-bold text-cyan-900">
                          {t("tourInstance.transportApprovals", "Transportation")}
                        </h3>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                        <span>{`${t("tourInstance.approved", "Approved")}: ${approvalSummary.transport.approved}`}</span>
                        <span>{`${t("tourInstance.pending", "Pending")}: ${approvalSummary.transport.pending}`}</span>
                        <span>{`${t("tourInstance.rejected", "Rejected")}: ${approvalSummary.transport.rejected}`}</span>
                        <span>{`${t("tourInstance.unassigned", "Unassigned")}: ${approvalSummary.transport.unassigned}`}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                      <div className="items-center gap-2 h-stack">
                        <Icon icon="heroicons:building-office-2" className="size-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-amber-900">
                          {t("tourInstance.hotelApprovals", "Accommodation")}
                        </h3>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                        <span>{`${t("tourInstance.approved", "Approved")}: ${approvalSummary.accommodation.approved}`}</span>
                        <span>{`${t("tourInstance.pending", "Pending")}: ${approvalSummary.accommodation.pending}`}</span>
                        <span>{`${t("tourInstance.rejected", "Rejected")}: ${approvalSummary.accommodation.rejected}`}</span>
                        <span>{`${t("tourInstance.unassigned", "Unassigned")}: ${approvalSummary.accommodation.unassigned}`}</span>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 pb-3 border-b border-stone-100">
                    {t("tourInstance.guidesAndManagers", "Team")}
                  </h2>
                  <TeamSection managers={data.managers ?? []} />
                </article>
              </div>
            </section>

            {data.instanceType?.toLowerCase() === "private" && canReassign ? (
              <section className="mb-8">
                <PrivateTourCoDesignOperatorSection
                  tourInstanceId={data.id}
                  bookingId={primaryPrivateBookingId}
                  days={data.days ?? []}
                  initialFinalSellPrice={data.finalSellPrice ?? null}
                  onFinalPriceSaved={() => void loadData()}
                />
              </section>
            ) : null}

            {/* Itinerary */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="items-center justify-between mb-4 h-stack">
                <h2 className="text-base font-bold text-stone-900">
                  {t("tourInstance.itinerary", "Itinerary")}
                </h2>
                <span className="text-xs text-stone-500">
                  {(data.days ?? []).length} {t("tourInstance.days", "days")}
                </span>
                {data.status === "available" && !readOnly && (
                  <button
                    type="button"
                    onClick={() => setAddingDay(!addingDay)}
                    className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100">
                    {addingDay ? t("common.cancel", "Cancel") : t("tourInstance.addDay", "Thêm ngày")}
                  </button>
                )}
              </div>

              {/* Inline form for adding a new custom day */}
              {addingDay && (
                <div className="mb-4 space-y-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4">
                  <h4 className="text-sm font-semibold text-orange-700">
                    {t("tourInstance.addCustomDay", "Thêm ngày mới")}
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        {t("tourInstance.form.title", "Title")} *
                      </label>
                      <input
                        type="text"
                        className={inputClassName}
                        value={newDayForm.title}
                        onChange={(e) => setNewDayForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder={t("tourInstance.form.titlePlaceholder", "VD: Tham quan tự do")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        {t("tourInstance.form.actualDate", "Actual Date")} *
                      </label>
                      <input
                        type="date"
                        className={inputClassName}
                        value={newDayForm.actualDate}
                        onChange={(e) => setNewDayForm((f) => ({ ...f, actualDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-600">
                      {t("tourInstance.form.description", "Description")}
                    </label>
                    <input
                      type="text"
                      className={inputClassName}
                      value={newDayForm.description}
                      onChange={(e) => setNewDayForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder={t("tourInstance.form.descriptionPlaceholder", "Mô tả ngày mới (tùy chọn)")}
                    />
                  </div>
                  <div className="justify-end gap-2 h-stack">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingDay(false);
                        setNewDayForm({ title: "", actualDate: "", description: "" });
                      }}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100">
                      {t("common.cancel", "Cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={saveNewDay}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                      {t("tourInstance.confirmAddDay", "Thêm")}
                    </button>
                  </div>
                </div>
              )}
              {(!data.days || data.days.length === 0) ? (
                <p className="text-sm text-stone-500">
                  {t("tourInstance.noItinerary", "No itinerary available for this instance.")}
                </p>
              ) : (
                <div className="relative border-l-2 border-stone-100 ml-4 pl-6 space-y-6 mt-2">
                  {data.days.map((day) => (
                    <div key={day.id} className="relative">
                      <span className="absolute -left-[41px] mt-3 size-8 rounded-full bg-stone-900 border-[3px] border-white text-xs font-bold text-white shadow-sm z-10 center">
                        {day.instanceDayNumber}
                      </span>
                      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm transition-colors hover:border-stone-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/20">
                        <div className="items-center justify-between gap-3 p-4 bg-stone-50/50 border-b border-stone-100 h-stack">
                          <div className="spacer items-center gap-3 h-stack">
                            <div>
                              <div className="items-center gap-2 h-stack">
                                <h3 className="text-sm font-semibold text-stone-900">{day.title}</h3>
                              </div>
                              {day.actualDate && (
                                <p className="text-xs text-stone-500">
                                  {t("tourInstance.form.actualDate", "Actual Date")}:{" "}
                                  {new Date(day.actualDate).toLocaleDateString("vi-VN")}
                                  {day.startTime && ` ${day.startTime}`}
                                  {day.endTime && ` - ${day.endTime}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="items-center gap-2 h-stack">
                            {editingDayId === day.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={cancelEditDay}
                                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100">
                                  {t("common.cancel", "Cancel")}
                                </button>
                                <button
                                  type="button"
                                  onClick={saveDay}
                                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                  {t("common.save", "Save")}
                                </button>
                              </>
                            ) : !readOnly && (
                              <button
                                type="button"
                                onClick={() => startEditDay(day)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-500 hover:bg-orange-50">
                                <Icon icon="heroicons:pencil-square" className="size-3.5" />
                                {t("common.edit", "Edit")}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Day Edit Form */}
                        {editingDayId === day.id && dayEditForm[day.id] && (
                          <div className="p-4 space-y-3 border-b border-stone-200 bg-blue-50">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-stone-600">
                                  {t("tourInstance.form.startTime", "Start Time")}
                                </label>
                                <input
                                  type="time"
                                  className={inputClassName}
                                  value={dayEditForm[day.id]?.startTime ?? ""}
                                  onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], startTime: e.target.value } }))}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-stone-600">
                                  {t("tourInstance.form.endTime", "End Time")}
                                </label>
                                <input
                                  type="time"
                                  className={inputClassName}
                                  value={dayEditForm[day.id]?.endTime ?? ""}
                                  onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], endTime: e.target.value } }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-stone-600">
                                {t("tourInstance.form.description", "Description")}
                              </label>
                              <textarea
                                className={cn(inputClassName, "resize-none")}
                                rows={2}
                                value={dayEditForm[day.id]?.description ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], description: e.target.value } }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-stone-600">
                                {t("tourInstance.form.note", "Note")}
                              </label>
                              <input
                                className={inputClassName}
                                value={dayEditForm[day.id]?.note ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], note: e.target.value } }))}
                                placeholder={t("tourInstance.form.notePlaceholder", "Admin note for this day...")}
                              />
                            </div>
                          </div>
                        )}

                        {!dayEditForm[day.id] && day.description && (
                          <p className="px-4 py-2 text-xs text-stone-600 border-b border-stone-100 bg-stone-50">
                            {day.description}
                          </p>
                        )}

                        {!dayEditForm[day.id] && day.note && (
                          <div className="px-4 py-2 border-b border-stone-100">
                            <p className="text-xs text-stone-500">
                              <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span> {day.note}
                            </p>
                          </div>
                        )}

                        {/* Activities */}
                        {day.activities && day.activities.length > 0 && (
                          <div className="p-4 space-y-2">
                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                              {t("tourInstance.activities", "Activities")}
                            </p>
                            {day.activities.map((activity) => (
                              <div key={activity.id} className="rounded-xl border border-stone-100 p-3 transition-colors hover:border-stone-300">
                                {editingActivityId === activity.id && activityEditForm[activity.id] ? (
                                  <div className="space-y-2">
                                    <div className="items-center justify-between h-stack">
                                      <p className="text-sm font-medium text-stone-900">{activity.title}</p>
                                      <div className="items-center gap-2 h-stack">
                                        <button
                                          type="button"
                                          onClick={cancelEditActivity}
                                          className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600 hover:bg-stone-100">
                                          {t("common.cancel", "Cancel")}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={saveActivity}
                                          className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                                          {t("common.save", "Save")}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-stone-500">
                                          {t("tourInstance.form.startTime", "Start Time")}
                                        </label>
                                        <input
                                          type="time"
                                          className={inputClassName}
                                          value={activityEditForm[activity.id]?.startTime ?? ""}
                                          onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], startTime: e.target.value } }))}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-stone-500">
                                          {t("tourInstance.form.endTime", "End Time")}
                                        </label>
                                        <input
                                          type="time"
                                          className={inputClassName}
                                          value={activityEditForm[activity.id]?.endTime ?? ""}
                                          onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], endTime: e.target.value } }))}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-stone-500">
                                        {t("tourInstance.form.note", "Note")}
                                      </label>
                                      <input
                                        className={inputClassName}
                                        value={activityEditForm[activity.id]?.note ?? ""}
                                        onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], note: e.target.value } }))}
                                        placeholder={t("tourInstance.form.activityNotePlaceholder", "Admin note for this activity...")}
                                      />
                                    </div>
                                    <label className="items-center gap-2 text-xs text-stone-600 h-stack">
                                      <input
                                        type="checkbox"
                                        checked={activityEditForm[activity.id]?.isOptional ?? false}
                                        onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], isOptional: e.target.checked } }))}
                                        className="size-4 rounded border-stone-300 text-orange-500"
                                      />
                                      {t("tourInstance.optional", "Optional")}
                                    </label>
                                  </div>
                                ) : (
                                  <div className="items-start gap-3 h-stack">
                                    <span className="mt-0.5 shrink-0 inline-flex items-center justify-center size-6 rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                      {activity.order}
                                    </span>
                                    <div className="spacer min-w-0">
                                      <div className="items-center gap-2 flex-wrap h-stack">
                                        <p className="text-sm font-medium text-stone-900">{activity.title}</p>
                                        {activity.isOptional && (
                                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                            {t("tourInstance.optional", "Optional")}
                                          </span>
                                        )}
                                      </div>
                                      {activity.description && (
                                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{activity.description}</p>
                                      )}
                                      <div className="items-center gap-3 mt-1 text-xs text-stone-400 h-stack">
                                        {activity.startTime && <span>{activity.startTime}</span>}
                                        {activity.endTime && <span> - {activity.endTime}</span>}
                                      </div>

                                      {isAccommodationActivity(activity.activityType) && (
                                        <div className="mt-2 space-y-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
                                          <div className="items-center justify-between gap-2 h-stack">
                                            <p className="items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 h-stack">
                                              <Icon icon="heroicons:building-office-2" className="size-3" />
                                              {t("tourInstance.accommodation.approval", "Accommodation approval")}
                                            </p>
                                            <div className="items-center gap-2 h-stack">
                                              <span
                                                className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", getApprovalAppearance(activity.accommodation?.supplierApprovalStatus).ringClassName)}
                                              >
                                                <Icon icon={getApprovalAppearance(activity.accommodation?.supplierApprovalStatus).icon} className="size-3" />
                                                {getApprovalAppearance(activity.accommodation?.supplierApprovalStatus).label}
                                              </span>
                                              {canReassign && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setReassignActivity(activity);
                                                    setReassignType("Accommodation");
                                                  }}
                                                  aria-label={`Đổi nhà cung cấp chỗ ở cho hoạt động ${activity.title}`}
                                                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                >
                                                  <Icon icon="heroicons:pencil-square" className="size-3" />
                                                  Đổi NCC
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="grid gap-2 sm:grid-cols-2">
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.accommodation.supplier", "Supplier")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.accommodation?.supplierName || t("tourInstance.noHotelProvider", "No hotel provider assigned")}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.accommodation.roomType", "Room type")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.accommodation?.roomType || "—"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.accommodation.quantity", "Quantity")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.accommodation?.quantity ?? "—"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.accommodation.blockedRooms", "Blocked rooms")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.accommodation?.roomBlocksTotal ?? 0}
                                              </p>
                                            </div>
                                          </div>
                                          {activity.accommodation?.supplierApprovalNote && (
                                            <p className="rounded-lg bg-white/70 px-2.5 py-2 text-xs text-stone-600">
                                              <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span>{" "}
                                              {activity.accommodation.supplierApprovalNote}
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {isTransportationActivity(activity.activityType) && (
                                        <div className="mt-2 space-y-2 rounded-lg border border-cyan-100 bg-cyan-50/70 p-3">
                                          <div className="items-center justify-between gap-2 h-stack">
                                            <p className="items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 h-stack">
                                              <Icon icon="heroicons:truck" className="size-3" />
                                              {t("tourInstance.transport.approval", "Transportation approval")}
                                            </p>
                                            <div className="items-center gap-2 h-stack">
                                              <span
                                                className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", getApprovalAppearance(activity.transportationApprovalStatus).ringClassName)}
                                              >
                                                <Icon icon={getApprovalAppearance(activity.transportationApprovalStatus).icon} className="size-3" />
                                                {getApprovalAppearance(activity.transportationApprovalStatus).label}
                                              </span>
                                              {canReassign && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setReassignActivity(activity);
                                                    setReassignType("Transportation");
                                                  }}
                                                  aria-label={`Đổi nhà cung cấp cho hoạt động ${activity.title}`}
                                                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                >
                                                  <Icon icon="heroicons:pencil-square" className="size-3" />
                                                  Đổi NCC
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          <div className="grid gap-2 sm:grid-cols-2">
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.transport.provider", "Supplier")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.transportSupplierName || t("tourInstance.noTransportProvider", "No transport provider assigned")}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.transport.requestedVehicleType", "Requested vehicle type")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.requestedVehicleType || "—"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.transport.requestedSeatCount", "Requested seats")}
                                              </p>
                                              <p className="text-xs font-semibold text-stone-800">
                                                {activity.requestedSeatCount ?? "—"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium uppercase text-stone-500">
                                                {t("tourInstance.transport.assignedVehicle", "Assigned vehicle")}
                                              </p>
                                              {activity.transportAssignments
                                              && activity.transportAssignments.length > 0 ? (
                                                <ul className="mt-1 space-y-2">
                                                  {activity.transportAssignments.map((ta) => (
                                                    <li
                                                      key={ta.id}
                                                      className="rounded-lg border border-stone-100 bg-white/80 px-2 py-1.5"
                                                    >
                                                      <div className="flex-wrap items-center gap-2 h-stack">
                                                        <span className="text-xs font-semibold text-stone-800 font-mono">
                                                          {[ta.vehicleBrand, ta.vehicleModel].filter(Boolean).join(" ") || "—"}
                                                        </span>
                                                        {ta.vehicleType && (
                                                          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] text-stone-500">
                                                            {ta.vehicleType}
                                                          </span>
                                                        )}
                                                        {ta.vehicleSeatCapacity && (
                                                          <span className="items-center gap-0.5 text-[10px] text-stone-500 h-stack">
                                                            <Icon icon="heroicons:user-group" className="size-3" />
                                                            {ta.vehicleSeatCapacity}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {(ta.driverName || ta.driverPhone) && (
                                                        <div className="mt-1 items-center gap-2 h-stack">
                                                          <Icon icon="heroicons:user" className="size-3 text-cyan-600 shrink-0" />
                                                          <span className="text-xs text-stone-700">{ta.driverName}</span>
                                                          {ta.driverPhone && (
                                                            <span className="text-[10px] text-stone-400">{ta.driverPhone}</span>
                                                          )}
                                                        </div>
                                                      )}
                                                    </li>
                                                  ))}
                                                </ul>
                                              ) : activity.vehicleType ? (
                                                <div className="flex-wrap items-center gap-2 h-stack">
                                                  <span className="text-xs font-semibold text-stone-800 font-mono">
                                                    {[activity.vehicleBrand, activity.vehicleModel].filter(Boolean).join(" ") || "—"}
                                                  </span>
                                                  {activity.vehicleType && (
                                                    <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] text-stone-500">
                                                      {activity.vehicleType}
                                                    </span>
                                                  )}
                                                  {activity.seatCapacity && (
                                                    <span className="items-center gap-0.5 text-[10px] text-stone-500 h-stack">
                                                      <Icon icon="heroicons:user-group" className="size-3" />
                                                      {activity.seatCapacity}
                                                    </span>
                                                  )}
                                                </div>
                                              ) : (
                                                <p className="text-[10px] italic text-amber-600">
                                                  {t("tourInstance.transport.notAssigned", "Chưa có xe được phân công")}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            {!(
                                              activity.transportAssignments
                                              && activity.transportAssignments.length > 0
                                            )
                                            && activity.driverName && (
                                              <div className="items-center gap-2 h-stack">
                                                <Icon icon="heroicons:user" className="size-3 text-cyan-600 shrink-0" />
                                                <span className="text-xs text-stone-700">{activity.driverName}</span>
                                                {activity.driverPhone && (
                                                  <span className="text-[10px] text-stone-400">{activity.driverPhone}</span>
                                                )}
                                              </div>
                                            )}
                                            {(activity.pickupLocation || activity.dropoffLocation) && (
                                              <div className="space-y-0.5">
                                                {activity.pickupLocation && (
                                                  <div className="items-start gap-1.5 h-stack">
                                                    <Icon icon="heroicons:map-pin" className="size-3 text-emerald-600 mt-0.5 shrink-0" />
                                                    <div>
                                                      <span className="text-[10px] font-medium text-stone-500 uppercase">Điểm đón: </span>
                                                      <span className="text-xs text-stone-700">{activity.pickupLocation}</span>
                                                    </div>
                                                  </div>
                                                )}
                                                {activity.dropoffLocation && (
                                                  <div className="items-start gap-1.5 h-stack">
                                                    <Icon icon="heroicons:map-pin" className="size-3 text-red-500 mt-0.5 shrink-0" />
                                                    <div>
                                                      <span className="text-[10px] font-medium text-stone-500 uppercase">Điểm trả: </span>
                                                      <span className="text-xs text-stone-700">{activity.dropoffLocation}</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {(activity.departureTime || activity.arrivalTime) && (
                                              <div className="items-center gap-3 text-[10px] text-stone-500 h-stack">
                                                {activity.departureTime && (
                                                  <span>Khởi hành: {new Date(activity.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                                )}
                                                {activity.arrivalTime && (
                                                  <span>Đến: {new Date(activity.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {activity.transportationApprovalNote && (
                                            <p className="rounded-lg bg-white/70 px-2.5 py-2 text-xs text-stone-600">
                                              <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span>{" "}
                                              {activity.transportationApprovalNote}
                                            </p>
                                          )}

                                          {canReassign && isExternalOnlyTransportation(activity.transportationType) && (
                                            <TicketImageUpload
                                              instanceId={data.id}
                                              activity={activity}
                                              bookingOptions={ticketBookingOptions}
                                              bookingOptionsLoading={ticketBookingOptionsLoading}
                                              hasBookings={(data.totalBookings ?? 0) > 0}
                                            />
                                          )}
                                        </div>
                                      )}

                                      {activity.note && (
                                        <p className="text-xs text-stone-500 mt-1">
                                          <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span> {activity.note}
                                        </p>
                                      )}
                                    </div>
                                    {!readOnly && (
                                      <div className="gap-1 shrink-0 v-stack">
                                        <button
                                          type="button"
                                          onClick={() => startEditActivity(day.id, activity)}
                                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700">
                                          <Icon icon="heroicons:pencil" className="size-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteActivity(day.id, activity.id)}
                                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700">
                                          <Icon icon="heroicons:trash" className="size-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            </div>
                          )}

                          {addingActivityForDayId === day.id ? (
                            <div className="p-4 border-t border-stone-100 bg-orange-50/50">
                              <div className="rounded-xl border border-orange-200 bg-white p-3 space-y-3 shadow-sm">
                                <h4 className="text-sm font-semibold text-orange-700">
                                  {t("tourInstance.wizard.addActivity", "Thêm hoạt động mới")}
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-stone-600">
                                      {t("tourInstance.wizard.activity.title", "Tiêu đề")} *
                                    </label>
                                    <input
                                      type="text"
                                      className={inputClassName}
                                      value={newActivityForm.title}
                                      onChange={(e) => setNewActivityForm((f) => ({ ...f, title: e.target.value }))}
                                      placeholder={t("tourInstance.form.titlePlaceholder", "Tên hoạt động")}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-stone-600">
                                      {t("tourInstance.wizard.activity.type", "Loại hoạt động")}
                                    </label>
                                    <select
                                      className={inputClassName}
                                      value={newActivityForm.activityType}
                                      onChange={(e) => setNewActivityForm((f) => ({ ...f, activityType: Number(e.target.value) }))}
                                    >
                                      <option value={0}>{t("activityTypes.0", "Tham quan")}</option>
                                      <option value={1}>{t("activityTypes.1", "Ăn uống")}</option>
                                      <option value={2}>{t("activityTypes.2", "Mua sắm")}</option>
                                      <option value={3}>{t("activityTypes.3", "Phiêu lưu")}</option>
                                      <option value={4}>{t("activityTypes.4", "Nghỉ dưỡng")}</option>
                                      <option value={5}>{t("activityTypes.5", "Văn hóa")}</option>
                                      <option value={6}>{t("activityTypes.6", "Giải trí")}</option>
                                      <option value={7}>{t("activityTypes.7", "Phương tiện")}</option>
                                      <option value={8}>{t("activityTypes.8", "Lưu trú")}</option>
                                      <option value={9}>{t("activityTypes.9", "Thời gian tự do")}</option>
                                      <option value={99}>{t("activityTypes.99", "Khác")}</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-stone-600">
                                      {t("tourInstance.wizard.activity.start", "Giờ bắt đầu")}
                                    </label>
                                    <input
                                      type="time"
                                      className={inputClassName}
                                      value={newActivityForm.startTime}
                                      onChange={(e) => setNewActivityForm((f) => ({ ...f, startTime: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-stone-600">
                                      {t("tourInstance.wizard.activity.end", "Giờ kết thúc")}
                                    </label>
                                    <input
                                      type="time"
                                      className={inputClassName}
                                      value={newActivityForm.endTime}
                                      onChange={(e) => setNewActivityForm((f) => ({ ...f, endTime: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-stone-600">
                                    {t("tourInstance.form.description", "Description")}
                                  </label>
                                  <textarea
                                    className={cn(inputClassName, "resize-none")}
                                    rows={2}
                                    value={newActivityForm.description}
                                    onChange={(e) => setNewActivityForm((f) => ({ ...f, description: e.target.value }))}
                                  />
                                </div>
                                <div className="items-center justify-between h-stack">
                                  <label className="items-center gap-2 text-xs text-stone-600 h-stack">
                                    <input
                                      type="checkbox"
                                      checked={newActivityForm.isOptional}
                                      onChange={(e) => setNewActivityForm((f) => ({ ...f, isOptional: e.target.checked }))}
                                      className="size-4 rounded border-stone-300 text-orange-500"
                                    />
                                    {t("tourInstance.optional", "Optional")}
                                  </label>
                                  <div className="items-center gap-2 h-stack">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingActivityForDayId(null);
                                        setNewActivityForm({ title: "", activityType: 0, description: "", note: "", startTime: "", endTime: "", isOptional: false });
                                      }}
                                      className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100">
                                      {t("common.cancel", "Cancel")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveNewActivity(day.id)}
                                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                      {t("common.add", "Thêm")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : !readOnly && (
                            <div className="p-4 border-t border-stone-100 bg-stone-50/50 justify-center h-stack">
                              <button
                                type="button"
                                onClick={() => setAddingActivityForDayId(day.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-500 transition-colors hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50"
                              >
                                <Icon icon="heroicons:plus" className="size-4" />
                                {t("tourInstance.addActivity", "Thêm hoạt động")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              )}
            </section>

            {/* ── Public tour per-booking assignment panel ── */}
            {data.instanceType?.toLowerCase() === "public" && canReassign && (() => {
              const allActivities = (data.days ?? []).flatMap((d) => d.activities ?? []);

              // Accommodation activities assigned to a hotel supplier
              const accomActivities = allActivities
                .filter((a) => isAccommodationActivity(a.activityType) && !!a.accommodation?.supplierId)
                .map((a, _i) => {
                  const day = data.days?.find((d) => d.activities?.some((x) => x.id === a.id));
                  return {
                    activityId: a.id,
                    title: a.title,
                    date: day?.actualDate ?? "",
                    dayNumber: day?.instanceDayNumber ?? 0,
                    roomBlocksTotal: a.accommodation?.roomBlocksTotal ?? 0,
                    quantity: a.accommodation?.quantity ?? 0,
                    roomType: a.accommodation?.roomType ?? null,
                    supplierName: a.accommodation?.supplierName ?? null,
                    supplierApprovalStatus: a.accommodation?.supplierApprovalStatus ?? null,
                  };
                });

              // External transport activities (Flight/Train/Boat)
              const externalActivities = allActivities
                .filter((a) => isTransportationActivity(a.activityType) && isExternalOnlyTransportation(a.transportationType ?? a.transportationName))
                .map((a) => {
                  const day = data.days?.find((d) => d.activities?.some((x) => x.id === a.id));
                  const rawType = (a.transportationType ?? a.transportationName ?? "") as string;
                  const transportType: "Flight" | "Train" | "Boat" =
                    rawType.toLowerCase().includes("flight") || rawType === "3" ? "Flight"
                    : rawType.toLowerCase().includes("boat") || rawType === "4" ? "Boat"
                    : "Train";
                  return {
                    activityId: a.id,
                    title: a.title,
                    date: day?.actualDate ?? "",
                    dayNumber: day?.instanceDayNumber ?? 0,
                    transportType,
                    confirmed: a.externalTransportConfirmed ?? false,
                  };
                });

              if (accomActivities.length === 0 && externalActivities.length === 0) return null;

              return (
                <PublicTourBookingAssignmentPanel
                  instanceId={data.id}
                  instanceType={data.instanceType ?? "public"}
                  bookings={publicTourBookings}
                  bookingsLoading={publicTourBookingsLoading}
                  accommodationActivities={accomActivities}
                  externalTransportActivities={externalActivities}
                  onSaveTicket={async (activityId, entry) => {
                    await tourInstanceService.saveBookingTicket(data.id, activityId, {
                      bookingId: entry.bookingId,
                      flightNumber: entry.flightNumber,
                      departureAt: entry.departureAt ? new Date(entry.departureAt).toISOString() : null,
                      arrivalAt: entry.arrivalAt ? new Date(entry.arrivalAt).toISOString() : null,
                      seatNumbers: entry.seatNumbers,
                      eTicketNumbers: entry.eTicketNumbers,
                      seatClass: entry.seatClass,
                      note: entry.note,
                    });
                    console.info("[PublicTour] Ticket saved for booking", entry.bookingId, "activity", activityId);
                  }}
                  onConfirmExternalTransport={async (activityId) => {
                    await tourInstanceService.confirmExternalTransport(data.id, activityId, true);
                    void loadData();
                  }}
                  onSaveRoomAssignment={async (activityId, payload) => {
                    await tourInstanceService.saveBookingRoomAssignment(data.id, activityId, payload);
                  }}
                  onLoadRoomAssignments={async (activityId) =>
                    tourInstanceService.getBookingRoomAssignments(data.id, activityId)
                  }
                />
              );
            })()}
          </>
        ) : (
          <form className="mt-8 space-y-8" onSubmit={handleSaveEdit}>
            <div className="items-center justify-between h-stack">
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                {t("tourInstance.edit", "Edit Tour Instance")}
              </h2>
            </div>

            {data.wantsCustomization && (
              <div className="items-start gap-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 p-5 shadow-sm h-stack">
                <Icon icon="heroicons:information-circle" className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">
                    {t("tourInstance.customerNote", "Ghi chú của khách hàng:")}
                  </h4>
                  <p className="mt-1.5 text-sm text-amber-700 leading-relaxed whitespace-pre-wrap max-w-[65ch]">
                    {data.customizationNotes || t("tourInstance.noNote", "Khách hàng muốn tùy chỉnh tour này.")}
                  </p>
                </div>
              </div>
            )}

            {/* Immutable fields — shown as read-only chips */}
            <div className="flex-wrap gap-2.5 rounded-[1.5rem] border border-stone-200/50 bg-stone-50/50 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] h-stack">
              <p className="w-full text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {t("tourInstance.immutableFields.note", "This field is locked after the instance is created")}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
                <Icon icon="heroicons:lock-closed" className="size-3.5 text-stone-400" />
                {t("tourInstance.instanceType", "Tour Instance Type")}: {data.instanceType}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
                <Icon icon="heroicons:lock-closed" className="size-3.5 text-stone-400" />
                {t("tourInstance.form.packageTour", "Package Tour")}: {data.tourName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
                <Icon icon="heroicons:lock-closed" className="size-3.5 text-stone-400" />
                {t("tourInstance.classification", "Classification")}: {data.classificationName}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Panel 1: General Info */}
                <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900 border-b border-stone-100 pb-4">
                    {t("tourInstance.form.generalInfo", "Thông tin chung")}
                  </h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.form.title", "Title")} *
                      </label>
                      <input
                        className={inputClassName}
                        value={form.title}
                        onChange={(event) => updateField("title", event.target.value)}
                      />
                      {errors.title && (
                        <p className="text-xs font-medium text-red-500">{errors.title}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.location", "Location")}
                      </label>
                      <input
                        className={inputClassName}
                        value={form.location}
                        onChange={(event) => updateField("location", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.instanceType", "Tour Instance Type")} *
                      </label>
                      <select
                        className={inputClassName}
                        value={form.instanceType}
                        onChange={(event) => updateField("instanceType", event.target.value)}>
                        <option value="1">{t("tourInstance.private", "Private")}</option>
                        <option value="2">{t("tourInstance.public", "Public")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Assignments */}
                <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900 border-b border-stone-100 pb-4">
                    {t("tourInstance.form.assignments", "Điều phối nhân sự")}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Guides */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {t("tourInstance.wizard.section.guides", "Guides")}
                      </label>
                      {selectedGuides.length > 0 && (
                        <div className="mb-3 flex-wrap gap-2 h-stack">
                          {selectedGuides.map((guide) => (
                            <span
                              key={guide.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/60 px-2.5 py-1 text-xs font-semibold text-orange-700">
                              {guide.avatar ? (
                                <img
                                  src={guide.avatar}
                                  alt=""
                                  className="size-5 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Icon icon="heroicons:user" className="size-3 text-orange-500" />
                              )}
                              <span className="max-w-24 truncate">
                                {guide.fullName || guide.username || guide.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleUser(guide.id, "guideUserIds")}
                                className="ml-1 size-4 rounded-full text-orange-400 transition-colors center hover:bg-orange-100 hover:text-orange-600">
                                <Icon icon="heroicons:x-mark" className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <select
                        className={inputClassName}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) toggleUser(e.target.value, "guideUserIds");
                          e.target.value = "";
                        }}>
                        <option value="">{t("tourInstance.form.addGuide", "+ Add guide")}</option>
                        {availableGuides
                          .filter((u) => !form.guideUserIds.includes(u.id))
                          .map((guide) => (
                            <option key={guide.id} value={guide.id}>
                              {guide.fullName || guide.username || guide.email}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="h-px w-full bg-stone-100"></div>

                    {/* Managers */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {t("tourInstance.wizard.section.managers", "Managers")}
                      </label>
                      {selectedManagers.length > 0 && (
                        <div className="mb-3 flex-wrap gap-2 h-stack">
                          {selectedManagers.map((mgr) => (
                            <span
                              key={mgr.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {mgr.avatar ? (
                                <img
                                  src={mgr.avatar}
                                  alt=""
                                  className="size-5 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Icon icon="heroicons:user" className="size-3 text-blue-500" />
                              )}
                              <span className="max-w-24 truncate">
                                {mgr.fullName || mgr.username || mgr.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleUser(mgr.id, "managerUserIds")}
                                className="ml-1 size-4 rounded-full text-blue-400 transition-colors center hover:bg-blue-100 hover:text-blue-600">
                                <Icon icon="heroicons:x-mark" className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <select
                        className={inputClassName}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) toggleUser(e.target.value, "managerUserIds");
                          e.target.value = "";
                        }}>
                        <option value="">{t("tourInstance.form.addManager", "+ Add manager")}</option>
                        {availableManagers
                          .filter((u) => !form.managerUserIds.includes(u.id))
                          .map((mgr) => (
                            <option key={mgr.id} value={mgr.id}>
                              {mgr.fullName || mgr.username || mgr.email}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Panel 3: Time & Price */}
                <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900 border-b border-stone-100 pb-4">
                    {t("tourInstance.form.timeAndPrice", "Thời gian & Giá cả")}
                  </h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.startDate", "Start Date")} *
                      </label>
                      <input
                        type="date"
                        className={inputClassName}
                        value={form.startDate}
                        onChange={(event) => updateField("startDate", event.target.value)}
                      />
                      {errors.startDate && <p className="text-xs font-medium text-red-500">{errors.startDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.endDate", "End Date")} *
                      </label>
                      <input
                        type="date"
                        className={inputClassName}
                        value={form.endDate}
                        onChange={(event) => updateField("endDate", event.target.value)}
                      />
                      {errors.endDate && <p className="text-xs font-medium text-red-500">{errors.endDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.maxParticipants", "Maximum Participants")} *
                      </label>
                      <input
                        type="number"
                        min={1}
                        className={inputClassName}
                        value={form.maxParticipation}
                        onChange={(event) => updateField("maxParticipation", event.target.value)}
                      />
                      {errors.maxParticipation && (
                        <p className="text-xs font-medium text-red-500">{errors.maxParticipation}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.basePrice", "Base Price")} *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">VND</span>
                        <input
                          type="number"
                          min={0}
                          className={cn(inputClassName, "pl-14")}
                          value={form.basePrice}
                          onChange={(event) => updateField("basePrice", event.target.value)}
                        />
                      </div>
                      {errors.basePrice && <p className="text-xs font-medium text-red-500">{errors.basePrice}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-semibold text-stone-700">
                        {t("tourInstance.confirmationDeadline", "Confirmation Deadline")}
                      </label>
                      <input
                        type="date"
                        className={inputClassName}
                        value={form.confirmationDeadline}
                        onChange={(event) => updateField("confirmationDeadline", event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 4: Services & Media */}
                <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900 border-b border-stone-100 pb-4">
                    {t("tourInstance.form.servicesAndMedia", "Dịch vụ & Tiện ích")}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Included Services */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {t("tourInstance.includedServices", "Included Services")}
                      </label>
                      <div className="space-y-2.5">
                        {form.includedServices.map((service, index) => (
                          <div key={`service-${index}`} className="items-center gap-2 h-stack">
                            <input
                              className={inputClassName}
                              value={service}
                              onChange={(event) => updateListItem("includedServices", index, event.target.value)}
                              placeholder="e.g. Free breakfast"
                            />
                            <button
                              type="button"
                              onClick={() => removeListItem("includedServices", index)}
                              className="shrink-0 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600 transition-colors center hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                              <Icon icon="heroicons:trash" className="size-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => appendListItem("includedServices")}
                          className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:border-stone-400">
                          <Icon icon="heroicons:plus" className="size-4" />
                          {t("tourInstance.form.addService", "Add service")}
                        </button>
                      </div>
                    </div>

                    <div className="h-px w-full bg-stone-100"></div>

                    {/* Images */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {t("tourInstance.form.media", "Media")}
                      </label>
                      <div className="space-y-2.5">
                        {form.imageUrls.map((url, index) => (
                          <div key={`image-${index}`} className="items-center gap-2 h-stack">
                            <input
                              className={inputClassName}
                              value={url}
                              onChange={(event) => updateListItem("imageUrls", index, event.target.value)}
                              placeholder={t("tourInstance.form.imageUrl", "Image URL (https://...)")}
                            />
                            <button
                              type="button"
                              onClick={() => removeListItem("imageUrls", index)}
                              className="shrink-0 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600 transition-colors center hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                              <Icon icon="heroicons:trash" className="size-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => appendListItem("imageUrls")}
                          className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:border-stone-400">
                          <Icon icon="heroicons:photo" className="size-4" />
                          {t("tourInstance.form.addImage", "Add image")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>

      {/* Supplier Reassignment Modal (tasks 3.10-3.11) */}
      {reassignActivity && (
        <SupplierReassignmentModal
          open={!!reassignActivity}
          onClose={() => setReassignActivity(null)}
          activity={reassignActivity}
          activityType={reassignType}
          tourInstanceId={id}
          onSuccess={() => {
            void loadData();
          }}
        />
      )}
    </>
  );
}
