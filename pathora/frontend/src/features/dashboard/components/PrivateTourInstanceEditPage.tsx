"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  tourInstanceService,
  type UpdateTourInstancePayload,
} from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceDto, TourInstanceDayDto, TourInstanceDayActivityDto, isExternalOnlyTransportation } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";
import { TransportActivitySubForm, TransportFields } from "./TransportActivitySubForm";

/* ── helpers ──────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#fa8b02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fa8b02]/20 transition-all";

const labelCls = "block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

const toDateInput = (iso?: string | null) =>
  iso ? iso.split("T")[0] : "";

/* ── form shape ───────────────────────────────────────────── */
interface EditForm {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipation: string;
  confirmationDeadline: string;
  operatorNote: string;
}

const fromDto = (data: NormalizedTourInstanceDto): EditForm => {
  // Auto-calculate endDate based on itinerary days count for private tours
  const computedStartDate = toDateInput(data.startDate);
  let computedEndDate = toDateInput(data.endDate);

  if (data.wantsCustomization && data.startDate && data.days && data.days.length > 0) {
    // endDate = startDate + (number of days - 1)
    const start = new Date(data.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + data.days.length - 1);
    computedEndDate = end.toISOString().split("T")[0];
  }

  // Auto-fill confirmation deadline for custom tour requests:
  // default to 3 days before start date when backend returns null
  let deadline = toDateInput(data.confirmationDeadline);
  if (!deadline && data.wantsCustomization && data.startDate) {
    const start = new Date(data.startDate);
    start.setDate(start.getDate() - 3);
    deadline = start.toISOString().split("T")[0];
  }
  return {
    title: data.title ?? "",
    startDate: computedStartDate,
    endDate: computedEndDate,
    location: data.location ?? "",
    maxParticipation: String(data.maxParticipation ?? 0),
    confirmationDeadline: deadline,
    operatorNote: "",
  };
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/* ══════════════════════════════════════════════════════════════
   PrivateTourInstanceEditPage
   ══════════════════════════════════════════════════════════════ */
export default function PrivateTourInstanceEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const pathname = usePathname();

  const isCustomRequest = pathname.includes("/custom-tour-requests/");
  const detailHref = isCustomRequest ? `/tour-operator/custom-tour-requests/${id}` : `/tour-operator/tour-instances/private/${id}`;
  const listHref = isCustomRequest ? "/tour-operator/custom-tour-requests" : "/tour-operator/tour-instances/private";

  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({});

  const loadData = useCallback(async () => {
    try {
      // Keep loading subtle if just refreshing
      setDataState((prev) => prev === "ready" ? "ready" : "loading");
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setForm((prev) => {
        if (!prev) return detail ? fromDto(detail) : null;
        // On refresh (after add/remove days), recalculate endDate from new data
        if (detail && detail.wantsCustomization && detail.days && detail.days.length > 0 && detail.startDate) {
          const start = new Date(detail.startDate);
          const end = new Date(start);
          end.setDate(end.getDate() + detail.days.length - 1);
          return { ...prev, endDate: end.toISOString().split("T")[0] };
        }
        return prev;
      });
      setDataState("ready");
    } catch (e: unknown) {
      setDataState((prev) => prev === "ready" ? "ready" : "error");
      setErrorMessage(handleApiError(e).message);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  const set = <K extends keyof EditForm>(key: K, val: EditForm[K]) => {
    setForm((f) => f ? { ...f, [key]: val } : f);
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Partial<Record<keyof EditForm, string>> = {};
    if (!form.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!form.startDate) errs.startDate = "Chọn ngày bắt đầu";
    if (!form.endDate) errs.endDate = "Chọn ngày kết thúc";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    if (!form.maxParticipation || Number(form.maxParticipation) <= 0)
      errs.maxParticipation = "Số khách phải lớn hơn 0";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin cơ bản");
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForReview = async () => {
    if (!data) return;
    setSubmittingReview(true);
    try {
      await tourInstanceService.submitPrivateTourForManagerReview(data.id);
      toast.success("Đã gửi lịch trình cho Manager duyệt!", { duration: 5000 });
      router.push(detailHref);
    } catch (e: unknown) {
      toast.error(handleApiError(e).message || "Không thể gửi cho Manager");
      setSubmittingReview(false);
    }
  };

  const handleSave = async () => {
    if (!data || !form || !validate()) return;
    setSaving(true);
    try {
      const payload: UpdateTourInstancePayload = {
        id: data.id,
        title: form.title.trim(),
        startDate: form.startDate + "T00:00:00Z",
        endDate: form.endDate + "T00:00:00Z",
        maxParticipation: Number(form.maxParticipation),
        basePrice: data.basePrice ?? 0,
        location: form.location.trim() || undefined,
        confirmationDeadline: form.confirmationDeadline
          ? form.confirmationDeadline + "T00:00:00Z"
          : undefined,
        guideUserIds: (data.managers ?? [])
          .filter((m) => m.role === "Guide")
          .map((m) => m.userId),
        managerUserIds: (data.managers ?? [])
          .filter((m) => m.role === "Manager")
          .map((m) => m.userId),
        thumbnailUrl: data.thumbnail?.publicURL ?? null,
      };

      await tourInstanceService.updateInstance(payload);
      toast.success("Đã lưu thông tin tour thành công!");
      router.push(detailHref);
    } catch (e: unknown) {
      const apiError = handleApiError(e);
      const isConflict =
        (e as { response?: { status?: number } })?.response?.status === 409;
      if (isConflict) {
        toast.error("Dữ liệu đã thay đổi bởi người khác. Vui lòng tải lại trang.");
        void loadData();
      } else {
        toast.error(apiError.message || "Lưu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (dataState === "loading") {
    return (
      <main className="py-8 px-4 md:px-6 max-w-5xl mx-auto space-y-5">
        <SkeletonCard />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </main>
    );
  }

  if (dataState === "error" || !data || !form) {
    return (
      <main className="py-12 px-4 max-w-5xl mx-auto">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Icon icon="heroicons:exclamation-circle" className="mx-auto mb-3 size-12 text-red-400" />
          <p className="font-semibold text-slate-900">Không thể tải dữ liệu tour</p>
          {errorMessage && <p className="mt-1 text-sm text-slate-500">{errorMessage}</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={loadData} className="rounded-xl bg-[#fa8b02] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#fa8b02]/90">Thử lại</button>
            <Link href={listHref} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Quay lại</Link>
          </div>
        </div>
      </main>
    );
  }

  const isLocked = data.status === "pendingmanagerreview" || data.status === "pendingcustomerapproval";

  return (
    <main className="py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">

      {/* Breadcrumb & Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href={listHref} className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <Icon icon="heroicons:arrow-left" className="size-4" />
            Tour Riêng Tư
          </Link>
          <Icon icon="heroicons:chevron-right" className="size-3.5" />
          <Link href={detailHref} className="hover:text-slate-900 transition-colors truncate max-w-[20ch]">
            {data.title || data.tourName}
          </Link>
          <Icon icon="heroicons:chevron-right" className="size-3.5" />
          <span className="text-slate-900 font-semibold">Chỉnh sửa thông tin &amp; lịch trình</span>
        </nav>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-tight">
            Chỉnh sửa Tour
          </h1>
        </div>
      </motion.div>

      {data.status === "pendingadjustment" && data.managerReviewNote && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
        >
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:exclamation-triangle" className="size-6 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-900">Manager yêu cầu chỉnh sửa</p>
              <p className="mt-1 text-sm text-rose-800 whitespace-pre-line">{data.managerReviewNote}</p>
              <p className="mt-2 text-xs text-rose-600">Sửa lịch trình theo yêu cầu rồi nhấn &quot;Gửi Manager duyệt lại&quot;.</p>
            </div>
          </div>
        </motion.div>
      )}

      {data.status === "pendingmanagerreview" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
        >
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:clock" className="size-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Đang chờ Manager duyệt</p>
              <p className="mt-1 text-sm text-amber-800">Lịch trình đã gửi và đang chờ phản hồi. Bạn không thể chỉnh sửa cho đến khi Manager phản hồi.</p>
            </div>
          </div>
        </motion.div>
      )}

      {data.status === "pendingcustomerapproval" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-sky-200 bg-sky-50 p-5"
        >
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:user-circle" className="size-6 text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-sky-900">Đã chuyển khách hàng duyệt</p>
              <p className="mt-1 text-sm text-sky-800">Manager đã đồng ý. Đang chờ khách hàng xác nhận lịch trình cuối cùng.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Basic Info Card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-[2.5rem] border border-slate-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="heroicons:document-text" className="size-5 text-[#fa8b02]" />
            Thông tin cơ bản
          </h2>
          <TourStatusBadge status={data.status} />
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <label className={labelCls}>Tiêu đề tour *</label>
            <input
              className={`${inputCls} ${errors.title ? "border-red-300 ring-1 ring-red-200" : ""} ${isLocked ? "bg-slate-100 opacity-70 cursor-not-allowed" : ""}`}
              placeholder="VD: Private — Nhật Bản 5 ngày"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              disabled={isLocked}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.title}</p>}
          </div>

          {/* Temporarily hidden: startDate and endDate inputs */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Điểm khởi hành</label>
              <input
                type="text"
                autoComplete="off"
                className={`${inputCls} ${isLocked ? "bg-slate-100 opacity-70 cursor-not-allowed" : ""}`}
                placeholder="VD: Hà Nội"
                value={form.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <label className={labelCls}>Số khách (Theo yêu cầu) *</label>
              <input
                type="number"
                min={1}
                className={`${inputCls} bg-slate-100 opacity-70 cursor-not-allowed`}
                value={form.maxParticipation}
                disabled
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Hạn xác nhận khách hàng</label>
            <input
              type="date"
              className={`${inputCls} ${isLocked ? "bg-slate-100 opacity-70 cursor-not-allowed" : ""}`}
              value={form.confirmationDeadline}
              max={form.startDate}
              onChange={(e) => set("confirmationDeadline", e.target.value)}
              disabled={isLocked}
            />
            {isCustomRequest && data && (
              <div className="mt-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-2">
                <Icon icon="heroicons:information-circle" className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Thời gian khách hàng muốn đi:</span>
                  <br />
                  Từ {formatDate(data.startDate)} đến {formatDate(data.endDate)}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Itinerary Editor Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-[2.5rem] border border-slate-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="heroicons:map" className="size-5 text-[#fa8b02]" />
            Chỉnh sửa lịch trình
          </h2>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <p className="text-sm text-slate-500 mb-6">
            Thêm, sửa, xoá các hoạt động trong tour. Các thay đổi lịch trình sẽ được lưu trực tiếp vào cơ sở dữ liệu.
          </p>
          
          <ItineraryEditor instanceId={data.id} days={data.days} startDate={form.startDate} endDate={form.endDate} onRefresh={loadData} readOnly={isLocked} />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-4 pb-12 pt-4"
      >
        {!isLocked && (
          <button
            onClick={handleSave}
            disabled={saving || submittingReview}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Icon icon="heroicons:cloud-arrow-up" className="size-5" />
                Lưu thông tin cơ bản
              </>
            )}
          </button>
        )}

        {(data.status === "draft" || data.status === "pendingadjustment") && (
          <button
            onClick={handleSubmitForReview}
            disabled={saving || submittingReview}
            className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-full bg-[#fa8b02] text-white text-sm font-bold transition-all hover:bg-[#fa8b02]/90 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-[#fa8b02]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
          >
            {submittingReview ? (
              <>
                <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Icon icon="heroicons:paper-airplane" className="size-5" />
                {data.status === "pendingadjustment" ? "Gửi Manager duyệt lại" : "Gửi Manager duyệt"}
              </>
            )}
          </button>
        )}

        <Link
          href={detailHref}
          className="flex-1 flex items-center justify-center py-4 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
        >
          Quay về
        </Link>
      </motion.div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   Itinerary Editor Components
   ══════════════════════════════════════════════════════════════ */
function ItineraryEditor({ instanceId, days, startDate, endDate, onRefresh, readOnly = false }: {
  instanceId: string;
  days?: TourInstanceDayDto[];
  startDate: string;
  endDate: string;
  onRefresh: () => void;
  readOnly?: boolean;
}) {
  const [addingDay, setAddingDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDate, setNewDayDate] = useState("");

  // Auto-suggest next date when opening the add-day form
  const suggestNextDate = useCallback(() => {
    if (days && days.length > 0) {
      // Find the latest date among existing days
      const sortedDates = days
        .map((d) => d.actualDate)
        .filter(Boolean)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());
      if (sortedDates.length > 0) {
        const next = new Date(sortedDates[0]);
        next.setDate(next.getDate() + 1);
        const nextStr = next.toISOString().split("T")[0];
        return nextStr;
      }
    }
    return startDate || "";
  }, [days, startDate, endDate]);

  const handleOpenAddDay = () => {
    const nextNum = (days?.length ?? 0) + 1;
    setNewDayTitle(`Ngày ${nextNum}`);
    setNewDayDate(suggestNextDate());
    setAddingDay(true);
  };
  const [saving, setSaving] = useState(false);
  // Track newly added day so DayEditor auto-opens the activity form
  const [newlyAddedDayId, setNewlyAddedDayId] = useState<string | null>(null);

  // ── Inline activity fields for the "Add Day" form ──
  const [actTitle, setActTitle] = useState("");
  const [actType, setActType] = useState("0");
  const [actStartTime, setActStartTime] = useState("");
  const [actEndTime, setActEndTime] = useState("");
  const [actPrice, setActPrice] = useState("");
  const [actNote, setActNote] = useState("");
  // Accommodation fields for add-day form
  const [actRoomType, setActRoomType] = useState("");
  const [actRoomCount, setActRoomCount] = useState("1");
  // Transportation fields for add-day form (full plan, mirrors ActivityForm)
  const emptyTransportFields: TransportFields = {
    transportationType: "",
    requestedVehicleType: "",
    requestedSeatCount: "",
    fromLocation: "",
    toLocation: "",
    departureTime: "",
    arrivalTime: "",
    externalTransportReference: "",
    transportationName: "",
  };
  const [actTransportFields, setActTransportFields] = useState<TransportFields>(emptyTransportFields);

  const isActAccommodation = actType === "8";
  const isActTransportation = actType === "7";
  const isActExternalTransport = isActTransportation && isExternalOnlyTransportation(actTransportFields.transportationType);

  const resetActivityFields = () => {
    setActTitle(""); setActType("0"); setActStartTime(""); setActEndTime(""); setActPrice(""); setActNote("");
    setActRoomType(""); setActRoomCount("1");
    setActTransportFields(emptyTransportFields);
  };

  const handleAddDay = async () => {
    if (!newDayTitle.trim() || !newDayDate) {
      toast.error("Vui lòng nhập tiêu đề ngày và chọn ngày");
      return;
    }
    if (startDate && newDayDate < startDate) {
      toast.error(`Ngày diễn ra không được trước ngày bắt đầu tour (${startDate})`);
      return;
    }
    const isDuplicateDate = (days ?? []).some((d) => {
      if (!d.actualDate) return false;
      const existing = new Date(d.actualDate).toISOString().split("T")[0];
      return existing === newDayDate;
    });
    if (isDuplicateDate) {
      toast.error("Đã có một ngày với ngày diễn ra này trong lịch trình");
      return;
    }
    if (endDate && newDayDate > endDate) {
      const proceed = window.confirm(
        `Ngày diễn ra (${newDayDate}) sau ngày kết thúc tour (${endDate}). Hệ thống sẽ tự động mở rộng phạm vi tour. Bạn có muốn tiếp tục?`,
      );
      if (!proceed) return;
    }
    if (!actTitle.trim()) {
      toast.error("Vui lòng nhập tên hoạt động đầu tiên cho ngày này");
      return;
    }
    if (actStartTime && actEndTime && actStartTime >= actEndTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }
    if (isActTransportation) {
      if (!actTransportFields.transportationType) {
        toast.error("Vui lòng chọn loại phương tiện");
        return;
      }
      if (!isActExternalTransport) {
        if (!actTransportFields.requestedVehicleType) {
          toast.error("Vui lòng chọn loại xe yêu cầu");
          return;
        }
        if (!actTransportFields.requestedSeatCount || Number(actTransportFields.requestedSeatCount) <= 0) {
          toast.error("Số chỗ yêu cầu phải lớn hơn 0");
          return;
        }
      } else {
        if (!actTransportFields.departureTime || !actTransportFields.arrivalTime) {
          toast.error("Vui lòng nhập giờ khởi hành và giờ đến");
          return;
        }
      }
    }
    setSaving(true);
    try {
      const result = await tourInstanceService.addCustomDay(instanceId, { title: newDayTitle.trim(), actualDate: newDayDate });
      const newDayId = result;

      if (newDayId) {
        const finalStartTime = isActExternalTransport ? actTransportFields.departureTime || actStartTime : actStartTime;
        const finalEndTime = isActExternalTransport ? actTransportFields.arrivalTime || actEndTime : actEndTime;

        const transportPayload = isActTransportation
          ? {
              transportationType: Number(actTransportFields.transportationType),
              transportationName: actTransportFields.transportationName || null,
              fromLocationId: actTransportFields.fromLocation || null,
              toLocationId: actTransportFields.toLocation || null,
              departureTime: actTransportFields.departureTime ? `${actTransportFields.departureTime}:00` : null,
              arrivalTime: actTransportFields.arrivalTime ? `${actTransportFields.arrivalTime}:00` : null,
              requestedVehicleType: actTransportFields.requestedVehicleType ? Number(actTransportFields.requestedVehicleType) : null,
              requestedSeatCount: actTransportFields.requestedSeatCount ? Number(actTransportFields.requestedSeatCount) : null,
              externalTransportReference: actTransportFields.externalTransportReference || null,
            }
          : {};

        await tourInstanceService.createInstanceActivity(instanceId, newDayId, {
          title: actTitle.trim(),
          activityType: Number(actType),
          note: actNote || undefined,
          startTime: finalStartTime ? `${finalStartTime}:00` : null,
          endTime: finalEndTime ? `${finalEndTime}:00` : null,
          price: actPrice ? Number(actPrice) : null,
          roomType: isActAccommodation && actRoomType.trim() ? actRoomType.trim() : null,
          roomCount: isActAccommodation ? (Number(actRoomCount) || 1) : null,
          ...transportPayload,
        });
      }

      toast.success("Thêm ngày mới và hoạt động thành công");
      setAddingDay(false);
      setNewDayTitle("");
      setNewDayDate("");
      resetActivityFields();
      // First activity already created in this flow — don't auto-open another empty
      // ActivityForm in DayEditor (was confusing user into thinking title wasn't saved).
      setNewlyAddedDayId(null);
      onRefresh();
    } catch (e: unknown) {
      toast.error(handleApiError(e).message || "Không thể thêm ngày");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {(!days || days.length === 0) ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-500">Chưa có lịch trình nào được thiết lập.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day, idx) => (
            <DayEditor
              key={day.id}
              instanceId={instanceId}
              day={day}
              index={idx}
              onRefresh={onRefresh}
              autoOpenActivity={day.id === newlyAddedDayId}
              onAutoOpenConsumed={() => setNewlyAddedDayId(null)}
              tourStartDate={startDate}
              tourEndDate={endDate}
              siblingDays={days}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {readOnly ? null : addingDay ? (
        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 space-y-5">
          <h4 className="text-sm font-bold text-slate-900">Thêm Ngày Mới</h4>

          {/* ── Day info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tiêu đề ngày</label>
              <input className={inputCls} value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)} placeholder="VD: Ngày 1 - Đón khách" />
            </div>
            <div>
              <label className={labelCls}>Ngày diễn ra</label>
              <input type="date" className={inputCls} value={newDayDate} min={startDate} onChange={e => setNewDayDate(e.target.value)} />
              {endDate && newDayDate && newDayDate > endDate && (
                <p className="mt-1 text-[11px] text-amber-600">
                  Ngày này nằm sau ngày kết thúc tour ({endDate}). Phạm vi tour sẽ được mở rộng tự động.
                </p>
              )}
            </div>
          </div>

          {/* ── First activity (required) ── */}
          <div className="border-t border-slate-200 pt-4">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Icon icon="heroicons:puzzle-piece" className="size-4 text-[#fa8b02]" />
              Hoạt động đầu tiên <span className="text-red-400">*</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tên hoạt động *</label>
                <input className={inputCls} value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="VD: Tham quan bảo tàng" />
              </div>
              <div>
                <label className={labelCls}>Loại hoạt động</label>
                <select className={inputCls} value={actType} onChange={e => setActType(e.target.value)}>
                  <option value="0">Tham quan (Sightseeing)</option>
                  <option value="1">Ăn uống (Dining)</option>
                  <option value="7">Di chuyển (Transportation)</option>
                  <option value="8">Lưu trú (Accommodation)</option>
                  <option value="99">Khác (Other)</option>
                </select>
              </div>
            </div>

            {/* Accommodation fields */}
            {isActAccommodation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div>
                  <label className={labelCls}>Loại phòng *</label>
                  <select className={inputCls} value={actRoomType} onChange={e => setActRoomType(e.target.value)}>
                    <option value="">-- Chọn loại phòng --</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Twin">Twin</option>
                    <option value="Triple">Triple</option>
                    <option value="Family">Family</option>
                    <option value="Suite">Suite</option>
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="VIP">VIP</option>
                    <option value="Quad">Quad</option>
                    <option value="Dormitory">Dormitory</option>
                    <option value="Villa">Villa</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Số lượng phòng *</label>
                  <input type="number" min={1} className={inputCls} value={actRoomCount} onChange={e => setActRoomCount(e.target.value)} placeholder="VD: 2" />
                </div>
              </div>
            )}

            {/* Transportation fields — mirrors ActivityForm */}
            {isActTransportation && (
              <div className="space-y-4 mt-3">
                <div>
                  <label className={labelCls}>Loại phương tiện *</label>
                  <select
                    className={inputCls}
                    value={actTransportFields.transportationType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const wasExternal = isExternalOnlyTransportation(actTransportFields.transportationType);
                      const isExternal = isExternalOnlyTransportation(newType);
                      if (actTransportFields.transportationType && wasExternal !== isExternal) {
                        if (!window.confirm("Loại phương tiện thay đổi sẽ xoá dữ liệu của nhóm cũ. Bạn có muốn tiếp tục?")) {
                          return;
                        }
                        setActTransportFields((prev) => ({
                          ...prev,
                          transportationType: newType,
                          requestedVehicleType: "",
                          requestedSeatCount: "",
                          transportationName: "",
                          externalTransportReference: "",
                          departureTime: "",
                          arrivalTime: "",
                        }));
                      } else {
                        setActTransportFields((prev) => ({ ...prev, transportationType: newType }));
                      }
                    }}
                  >
                    <option value="">-- Chọn loại phương tiện --</option>
                    <optgroup label="Đường bộ (Có nhà xe)">
                      <option value="1">Bus</option>
                      <option value="5">Car</option>
                      <option value="8">Taxi</option>
                    </optgroup>
                    <optgroup label="Mua vé rời (Manager tự book)">
                      <option value="3">Máy bay (Flight)</option>
                      <option value="2">Tàu hoả (Train)</option>
                      <option value="4">Tàu thuỷ/Du thuyền (Boat)</option>
                      <option value="99">Khác (Other)</option>
                    </optgroup>
                  </select>
                </div>

                {actTransportFields.transportationType && (
                  <TransportActivitySubForm
                    fields={actTransportFields}
                    onChange={(updates) => setActTransportFields((prev) => ({ ...prev, ...updates }))}
                    isEditing={false}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              {!isActExternalTransport && (
                <>
                  <div>
                    <label className={labelCls}>Giờ bắt đầu</label>
                    <input type="time" className={inputCls} value={actStartTime} onChange={e => setActStartTime(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Giờ kết thúc</label>
                    <input type="time" className={inputCls} value={actEndTime} onChange={e => setActEndTime(e.target.value)} />
                  </div>
                </>
              )}
              <div className={isActExternalTransport ? "sm:col-span-3" : ""}>
                <label className={labelCls}>Giá (Tuỳ chọn)</label>
                <input type="number" min="0" step="any" className={inputCls} value={actPrice} onChange={e => setActPrice(e.target.value)} placeholder="VD: 500000" />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Ghi chú / Mô tả</label>
              <textarea className={inputCls} rows={2} value={actNote} onChange={e => setActNote(e.target.value)} placeholder="Thông tin chi tiết về hoạt động này..." />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setAddingDay(false); resetActivityFields(); }} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Huỷ</button>
            <button onClick={handleAddDay} disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" /> : <Icon icon="heroicons:plus" className="size-4" />}
              {saving ? "Đang lưu..." : "Lưu Ngày & Hoạt Động"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleOpenAddDay}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <Icon icon="heroicons:plus" className="size-5" />
          Thêm Ngày Mới
        </button>
      )}
    </div>
  );
}

function DayEditor({ instanceId, day, index, onRefresh, autoOpenActivity, onAutoOpenConsumed, tourStartDate, tourEndDate, siblingDays, readOnly = false }: {
  instanceId: string;
  day: TourInstanceDayDto;
  index: number;
  onRefresh: () => void;
  autoOpenActivity?: boolean;
  onAutoOpenConsumed?: () => void;
  tourStartDate?: string;
  tourEndDate?: string;
  siblingDays?: TourInstanceDayDto[];
  readOnly?: boolean;
}) {
  const [addingAct, setAddingAct] = useState(false);
  const hasActivities = day.activities && day.activities.length > 0;

  const initialDate = toDateInput(day.actualDate) || "";
  const [editingDay, setEditingDay] = useState(false);
  const [editTitle, setEditTitle] = useState(day.title || "");
  const [editDate, setEditDate] = useState(initialDate);
  const [editNote, setEditNote] = useState(day.note || "");
  const [savingDay, setSavingDay] = useState(false);

  // Auto-open activity form for newly created days
  useEffect(() => {
    if (autoOpenActivity && !addingAct) {
      setAddingAct(true);
      onAutoOpenConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenActivity]);

  const startEditingDay = () => {
    setEditTitle(day.title || "");
    setEditDate(initialDate);
    setEditNote(day.note || "");
    setEditingDay(true);
  };

  const handleSaveDay = async () => {
    if (!editTitle.trim() || !editDate) {
      toast.error("Vui lòng nhập tiêu đề ngày và chọn ngày diễn ra");
      return;
    }
    if (tourStartDate && editDate < tourStartDate) {
      toast.error(`Ngày diễn ra không được trước ngày bắt đầu tour (${tourStartDate})`);
      return;
    }
    const dup = (siblingDays ?? []).some((d) => {
      if (d.id === day.id || !d.actualDate) return false;
      return new Date(d.actualDate).toISOString().split("T")[0] === editDate;
    });
    if (dup) {
      toast.error("Đã có một ngày khác với ngày diễn ra này trong lịch trình");
      return;
    }
    if (tourEndDate && editDate > tourEndDate) {
      const ok = window.confirm(
        `Ngày diễn ra (${editDate}) sau ngày kết thúc tour (${tourEndDate}). Hệ thống sẽ tự động mở rộng phạm vi tour. Tiếp tục?`,
      );
      if (!ok) return;
    }
    setSavingDay(true);
    try {
      await tourInstanceService.updateInstanceDay(instanceId, day.id, {
        title: editTitle.trim(),
        actualDate: editDate,
        note: editNote || null,
      });
      toast.success("Cập nhật ngày thành công");
      setEditingDay(false);
      onRefresh();
    } catch (e: unknown) {
      toast.error(handleApiError(e).message || "Không thể cập nhật ngày");
    } finally {
      setSavingDay(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-white">
      <div className="bg-slate-100/50 px-5 py-4 border-b border-slate-200">
        {editingDay ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tiêu đề ngày *</label>
                <input className={inputCls} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="VD: Ngày 1 - Đón khách" />
              </div>
              <div>
                <label className={labelCls}>Ngày diễn ra *</label>
                <input type="date" className={inputCls} value={editDate} min={tourStartDate} onChange={(e) => setEditDate(e.target.value)} />
                {tourEndDate && editDate && editDate > tourEndDate && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Ngày này nằm sau ngày kết thúc tour ({tourEndDate}). Phạm vi tour sẽ được mở rộng tự động.
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Ghi chú</label>
              <textarea className={inputCls} rows={2} value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Mô tả ngắn về ngày này..." />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingDay(false)}
                disabled={savingDay}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleSaveDay}
                disabled={savingDay}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Icon icon={savingDay ? "heroicons:arrow-path" : "heroicons:check"} className={`size-4 ${savingDay ? 'animate-spin' : ''}`} />
                {savingDay ? "Đang lưu..." : "Lưu ngày"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ngày {day.instanceDayNumber}: {day.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{toDateInput(day.actualDate)}</p>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={startEditingDay}
                  className="p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-sm transition-all"
                  title="Sửa tên/ngày"
                >
                  <Icon icon="heroicons:pencil-square" className="size-4" />
                </button>
                {hasActivities && (
                  <button
                    onClick={() => setAddingAct(!addingAct)}
                    className={`p-2 rounded-full border shadow-sm transition-all ${addingAct ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'bg-white text-[#fa8b02] border-slate-200 hover:shadow hover:text-[#fa8b02]/80'}`}
                    title={addingAct ? "Đóng form thêm hoạt động" : "Thêm hoạt động"}
                  >
                    <Icon icon={addingAct ? "heroicons:x-mark" : "heroicons:plus"} className="size-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {!hasActivities && !addingAct ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Icon icon="heroicons:puzzle-piece" className="size-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">Chưa có hoạt động nào trong ngày này.</p>
            {!readOnly && (
              <button
                onClick={() => setAddingAct(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fa8b02] text-white text-sm font-semibold rounded-xl hover:bg-[#fa8b02]/90 transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
              >
                <Icon icon="heroicons:plus" className="size-4" />
                Thêm hoạt động đầu tiên
              </button>
            )}
          </div>
        ) : (
          <>
            {day.activities?.map((act) => (
              <ActivityEditor key={act.id} instanceId={instanceId} dayId={day.id} act={act} dayActivities={day.activities} onRefresh={onRefresh} readOnly={readOnly} />
            ))}
          </>
        )}

        {addingAct && !readOnly && (
          <ActivityForm
            instanceId={instanceId}
            dayId={day.id}
            dayActivities={day.activities}
            onCancel={() => setAddingAct(false)}
            onSuccess={() => { setAddingAct(false); onRefresh(); }}
          />
        )}

        {/* Explicit add activity button after existing activities */}
        {hasActivities && !addingAct && !readOnly && (
          <button
            onClick={() => setAddingAct(true)}
            className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-[#fa8b02] hover:border-[#fa8b02]/30 hover:bg-[#fa8b02]/5 transition-all flex items-center justify-center gap-1.5"
          >
            <Icon icon="heroicons:plus" className="size-3.5" />
            Thêm hoạt động
          </button>
        )}
      </div>
    </div>
  );
}

function ActivityEditor({ instanceId, dayId, act, dayActivities, onRefresh, readOnly = false }: { instanceId: string, dayId: string, act: TourInstanceDayActivityDto, dayActivities?: TourInstanceDayActivityDto[], onRefresh: () => void, readOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Bạn chắc chắn muốn xoá hoạt động "${act.title}"?`)) return;
    setIsDeleting(true);
    try {
      await tourInstanceService.deleteInstanceActivity(instanceId, dayId, act.id);
      toast.success("Đã xoá hoạt động");
      onRefresh();
    } catch (e: unknown) {
      toast.error(handleApiError(e).message || "Không thể xoá hoạt động");
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <ActivityForm 
        instanceId={instanceId} 
        dayId={dayId} 
        initialData={act} 
        dayActivities={dayActivities}
        onCancel={() => setIsEditing(false)} 
        onSuccess={() => { setIsEditing(false); onRefresh(); }} 
      />
    );
  }

  return (
    <div className="group flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 hover:shadow-sm transition-all relative">
      <div className="mt-0.5 shrink-0">
        {act.activityType === "Transportation" || act.activityType === "7" ? (
          <Icon icon="heroicons:truck" className="size-5 text-blue-500" />
        ) : act.activityType === "Accommodation" || act.activityType === "8" ? (
          <Icon icon="heroicons:home" className="size-5 text-indigo-500" />
        ) : (
          <Icon icon="heroicons:bolt" className="size-5 text-[#fa8b02]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap pr-16">
          <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
          {(act.startTime || act.endTime) && (
            <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {act.startTime?.slice(0, 5) || "--"} - {act.endTime?.slice(0, 5) || "--"}
            </span>
          )}
          {act.price != null && (
            <span className="text-[10px] font-bold text-[#fa8b02] bg-[#fa8b02]/10 px-1.5 py-0.5 rounded border border-[#fa8b02]/20">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(act.price)}
            </span>
          )}
        </div>
        {act.note && <p className="text-xs text-slate-600 mt-1">{act.note}</p>}
      </div>

      {!readOnly && (
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-50 pl-2">
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
            <Icon icon="heroicons:pencil" className="size-4" />
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
            <Icon icon="heroicons:trash" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityForm({ instanceId, dayId, initialData, dayActivities, onCancel, onSuccess }: { 
  instanceId: string, 
  dayId: string, 
  initialData?: TourInstanceDayActivityDto, 
  dayActivities?: TourInstanceDayActivityDto[],
  onCancel: () => void, 
  onSuccess: () => void 
}) {
  const isEditing = !!initialData;
  const [title, setTitle] = useState(initialData?.title || "");
  const [actType, setActType] = useState(initialData?.activityType || "0");
  
  let defaultStartTime = initialData?.startTime?.slice(0, 5) || "";
  if (!isEditing && dayActivities && dayActivities.length > 0) {
    const lastAct = dayActivities[dayActivities.length - 1];
    defaultStartTime = lastAct.endTime?.slice(0, 5) || lastAct.startTime?.slice(0, 5) || "";
  }

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(initialData?.endTime?.slice(0,5) || "");
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "");
  const [note, setNote] = useState(initialData?.note || "");
  const [saving, setSaving] = useState(false);

  // Accommodation fields
  const [roomType, setRoomType] = useState(initialData?.accommodation?.roomType || "");
  const [roomCount, setRoomCount] = useState(initialData?.accommodation?.quantity ? String(initialData.accommodation.quantity) : "1");

  // Transportation fields
  const getTransportTypeValue = (type: string | number | null | undefined): string => {
    if (!type) return "";
    if (typeof type === "number") return String(type);
    const num = Number(type);
    if (!isNaN(num)) return String(num);
    const mapping: Record<string, string> = {
      "bus": "1", "train": "2", "flight": "3", "boat": "4", "car": "5", "taxi": "8", "other": "99"
    };
    return mapping[type.toLowerCase()] || "";
  };

  const [transportFields, setTransportFields] = useState<TransportFields>({
    transportationType: getTransportTypeValue(initialData?.transportationType),
    requestedVehicleType: initialData?.requestedVehicleType ? String(initialData.requestedVehicleType) : "",
    requestedSeatCount: initialData?.requestedSeatCount ? String(initialData.requestedSeatCount) : "",
    fromLocation: initialData?.fromLocation?.locationName || "",
    toLocation: initialData?.toLocation?.locationName || "",
    departureTime: initialData?.departureTime?.slice(0, 5) || "",
    arrivalTime: initialData?.arrivalTime?.slice(0, 5) || "",
    externalTransportReference: initialData?.externalTransportReference || "",
    transportationName: initialData?.transportationName || "",
  });

  const isAccommodation = actType === "8" || actType === "Accommodation";
  const isTransportation = actType === "7" || actType === "Transportation";

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên hoạt động");
      return;
    }

    if (startTime && endTime && startTime >= endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    if (startTime && dayActivities) {
      const currentIndex = isEditing && initialData 
        ? dayActivities.findIndex(a => a.id === initialData.id) 
        : dayActivities.length;

      if (currentIndex > 0) {
        const prevAct = dayActivities[currentIndex - 1];
        const prevTime = prevAct.endTime?.slice(0, 5) || prevAct.startTime?.slice(0, 5);
        if (prevTime && prevTime > startTime) {
          toast.error(`Giờ bắt đầu phải sau hoặc bằng thời gian của hoạt động trước đó (${prevTime})`);
          return;
        }
      }

      if (currentIndex < dayActivities.length - 1) {
        const nextAct = dayActivities[currentIndex + 1];
        const nextTime = nextAct.startTime?.slice(0, 5);
        const myEndTime = endTime || startTime;
        if (nextTime && nextTime < myEndTime) {
          toast.error(`Thời gian kết thúc phải trước hoặc bằng giờ bắt đầu của hoạt động sau (${nextTime})`);
          return;
        }
      }
    }

    // Validate accommodation fields
    if (isAccommodation && !isEditing) {
      if (!roomType.trim()) {
        toast.error("Vui lòng nhập loại phòng (VD: Standard, Deluxe, Suite)");
        return;
      }
      if (!roomCount || Number(roomCount) <= 0) {
        toast.error("Số lượng phòng phải lớn hơn 0");
        return;
      }
    }

    // Validate transportation fields
    if (isTransportation) {
      if (!transportFields.transportationType) {
        toast.error("Vui lòng chọn Loại phương tiện");
        return;
      }

      const isExt = isExternalOnlyTransportation(transportFields.transportationType);
      if (!isExt) {
        // Ground validation
        if (!transportFields.requestedVehicleType) {
          toast.error("Vui lòng chọn Loại xe yêu cầu");
          return;
        }
        if (!transportFields.requestedSeatCount || Number(transportFields.requestedSeatCount) <= 0) {
          toast.error("Vui lòng nhập số ghế hợp lệ");
          return;
        }
      } else {
        // External validation
        if (!transportFields.departureTime || !transportFields.arrivalTime) {
          toast.error("Vui lòng nhập Giờ khởi hành và Giờ đến dự kiến cho phương tiện ngoài");
          return;
        }
      }
    }

    const baseTransportPayload = isTransportation ? {
      transportationType: Number(transportFields.transportationType),
      fromLocationId: transportFields.fromLocation ? transportFields.fromLocation : null, // Backend uses LocationId but we only have string name for now. If BE expects ID, this is a known gap, we might need a location picker.
      toLocationId: transportFields.toLocation ? transportFields.toLocation : null,
      departureTime: transportFields.departureTime ? `${transportFields.departureTime}:00` : null,
      arrivalTime: transportFields.arrivalTime ? `${transportFields.arrivalTime}:00` : null,
      requestedVehicleType: transportFields.requestedVehicleType ? Number(transportFields.requestedVehicleType) : null,
      requestedSeatCount: transportFields.requestedSeatCount ? Number(transportFields.requestedSeatCount) : null,
      externalTransportReference: transportFields.externalTransportReference || null,
      transportationName: transportFields.transportationName || null,
    } : {};

    const isExternalTransport = isTransportation && isExternalOnlyTransportation(transportFields.transportationType);
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (isExternalTransport) {
      finalStartTime = transportFields.departureTime || startTime;
      finalEndTime = transportFields.arrivalTime || endTime;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await tourInstanceService.updateInstanceActivity(instanceId, dayId, initialData.id, {
          title: title.trim(),
          note: note,
          startTime: finalStartTime ? `${finalStartTime}:00` : null,
          endTime: finalEndTime ? `${finalEndTime}:00` : null,
          price: price ? Number(price) : null,
          ...baseTransportPayload,
          roomType: isAccommodation && roomType.trim() ? roomType.trim() : null,
          roomCount: isAccommodation ? (Number(roomCount) || 1) : null,
        });
        toast.success("Cập nhật hoạt động thành công");
      } else {
        await tourInstanceService.createInstanceActivity(instanceId, dayId, {
          title: title.trim(),
          activityType: Number(actType),
          note: note,
          startTime: finalStartTime ? `${finalStartTime}:00` : null,
          endTime: finalEndTime ? `${finalEndTime}:00` : null,
          price: price ? Number(price) : null,
          ...baseTransportPayload,
          roomType: isAccommodation && roomType.trim() ? roomType.trim() : null,
          roomCount: isAccommodation ? (Number(roomCount) || 1) : null,
        });

        toast.success("Thêm hoạt động thành công");
      }
      onSuccess();
    } catch (e: unknown) {
      toast.error(handleApiError(e).message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">{isEditing ? "Sửa hoạt động" : "Thêm hoạt động mới"}</h4>
        <button 
          type="button" 
          onClick={onCancel} 
          className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
          title="Đóng form"
        >
          <Icon icon="heroicons:x-mark" className="size-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tên hoạt động *</label>
          <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Tham quan bảo tàng" />
        </div>
        <div>
          <label className={labelCls}>Loại hoạt động</label>
          <select 
            className={`${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} 
            value={actType} 
            onChange={e => setActType(e.target.value)}
            disabled={isEditing}
          >
            <option value="0">Tham quan (Sightseeing)</option>
            <option value="1">Ăn uống (Dining)</option>
            <option value="7">Di chuyển (Transportation)</option>
            <option value="8">Lưu trú (Accommodation)</option>
            <option value="99">Khác (Other)</option>
          </select>
        </div>
      </div>

      {/* Accommodation-specific fields */}
      {isAccommodation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div>
            <label className={labelCls}>Loại phòng *</label>
            <select 
              className={`${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed bg-indigo-100/50' : ''}`} 
              value={roomType} 
              onChange={e => setRoomType(e.target.value)}
              disabled={isEditing}
            >
              <option value="">-- Chọn loại phòng --</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Twin">Twin</option>
              <option value="Triple">Triple</option>
              <option value="Family">Family</option>
              <option value="Suite">Suite</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="VIP">VIP</option>
              <option value="Quad">Quad</option>
              <option value="Dormitory">Dormitory</option>
              <option value="Villa">Villa</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Số lượng phòng *</label>
            <input 
              type="number" 
              min={1} 
              className={`${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed bg-indigo-100/50' : ''}`} 
              value={roomCount} 
              onChange={e => setRoomCount(e.target.value)} 
              placeholder="VD: 2" 
              disabled={isEditing}
            />
          </div>
        </div>
      )}

      {/* Transportation-specific fields */}
      {isTransportation && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Loại phương tiện *</label>
            <select
              className={inputCls}
              value={transportFields.transportationType}
              onChange={(e) => {
                const newType = e.target.value;
                const wasExternal = isExternalOnlyTransportation(transportFields.transportationType);
                const isExternal = isExternalOnlyTransportation(newType);
                
                if (transportFields.transportationType && wasExternal !== isExternal) {
                  if (!window.confirm("Loại phương tiện thay đổi sẽ xoá dữ liệu của nhóm cũ. Bạn có muốn tiếp tục?")) {
                    return;
                  }
                  // Clear incompatible fields
                  setTransportFields(prev => ({
                    ...prev,
                    transportationType: newType,
                    requestedVehicleType: "",
                    requestedSeatCount: "",
                    transportationName: "",
                    externalTransportReference: "",
                    departureTime: "",
                    arrivalTime: "",
                  }));
                } else {
                  setTransportFields(prev => ({ ...prev, transportationType: newType }));
                }
              }}
            >
              <option value="">-- Chọn loại phương tiện --</option>
              <optgroup label="Đường bộ (Có nhà xe)">
                <option value="1">Bus</option>
                <option value="5">Car</option>
                <option value="8">Taxi</option>
              </optgroup>
              <optgroup label="Mua vé rời (Manager tự book)">
                <option value="3">Máy bay (Flight)</option>
                <option value="2">Tàu hoả (Train)</option>
                <option value="4">Tàu thuỷ/Du thuyền (Boat)</option>
                <option value="99">Khác (Other)</option>
              </optgroup>
            </select>
          </div>

          {transportFields.transportationType && (
            <TransportActivitySubForm
              fields={transportFields}
              onChange={(updates) => setTransportFields((prev) => ({ ...prev, ...updates }))}
              isEditing={isEditing}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {!(isTransportation && isExternalOnlyTransportation(transportFields.transportationType)) && (
          <>
            <div>
              <label className={labelCls}>Giờ bắt đầu</label>
              <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Giờ kết thúc</label>
              <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <label className={labelCls}>Giá (Tuỳ chọn)</label>
          <input type="number" min="0" step="any" className={inputCls} value={price} onChange={e => setPrice(e.target.value)} placeholder="VD: 500000" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Ghi chú / Mô tả</label>
        <textarea className={inputCls} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Thông tin chi tiết về hoạt động này..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Huỷ</button>
        <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
          {isEditing ? "Cập nhật" : "Thêm hoạt động"}
        </button>
      </div>
    </div>
  );
}
