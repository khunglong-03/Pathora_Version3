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
import { NormalizedTourInstanceDto, TourInstanceDayDto, TourInstanceDayActivityDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";

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

const fromDto = (data: NormalizedTourInstanceDto): EditForm => ({
  title: data.title ?? "",
  startDate: toDateInput(data.startDate),
  endDate: toDateInput(data.endDate),
  location: data.location ?? "",
  maxParticipation: String(data.maxParticipation ?? 0),
  confirmationDeadline: toDateInput(data.confirmationDeadline),
  operatorNote: "",
});

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
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({});

  const loadData = useCallback(async () => {
    try {
      // Keep loading subtle if just refreshing
      setDataState((prev) => prev === "ready" ? "ready" : "loading");
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setForm((prev) => prev || (detail ? fromDto(detail) : null));
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
              className={`${inputCls} ${errors.title ? "border-red-300 ring-1 ring-red-200" : ""}`}
              placeholder="VD: Private — Nhật Bản 5 ngày"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Ngày bắt đầu *</label>
              <input
                type="date"
                className={`${inputCls} ${errors.startDate ? "border-red-300 ring-1 ring-red-200" : ""}`}
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              {errors.startDate && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.startDate}</p>}
            </div>
            <div>
              <label className={labelCls}>Ngày kết thúc *</label>
              <input
                type="date"
                className={`${inputCls} ${errors.endDate ? "border-red-300 ring-1 ring-red-200" : ""}`}
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
              {errors.endDate && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Điểm khởi hành</label>
              <input
                className={inputCls}
                placeholder="VD: Hà Nội"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Số khách tối đa *</label>
              <input
                type="number"
                min={1}
                className={`${inputCls} ${errors.maxParticipation ? "border-red-300 ring-1 ring-red-200" : ""}`}
                value={form.maxParticipation}
                onChange={(e) => set("maxParticipation", e.target.value)}
              />
              {errors.maxParticipation && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.maxParticipation}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Hạn xác nhận khách hàng</label>
            <input
              type="date"
              className={inputCls}
              value={form.confirmationDeadline}
              max={form.startDate}
              onChange={(e) => set("confirmationDeadline", e.target.value)}
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
          
          <ItineraryEditor instanceId={data.id} days={data.days} onRefresh={loadData} />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-4 pb-12 pt-4"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-full bg-[#fa8b02] text-white text-sm font-bold transition-all hover:bg-[#fa8b02]/90 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-[#fa8b02]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
        >
          {saving ? (
            <>
              <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
              Đang lưu thông tin...
            </>
          ) : (
            <>
              <Icon icon="heroicons:check-badge" className="size-5" />
              Lưu Thông Tin Cơ Bản &amp; Quay Về
            </>
          )}
        </button>
        <Link
          href={detailHref}
          className="flex-1 flex items-center justify-center py-4 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
        >
          Huỷ thay đổi
        </Link>
      </motion.div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   Itinerary Editor Components
   ══════════════════════════════════════════════════════════════ */
function ItineraryEditor({ instanceId, days, onRefresh }: { instanceId: string, days?: TourInstanceDayDto[], onRefresh: () => void }) {
  const [addingDay, setAddingDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDate, setNewDayDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddDay = async () => {
    if (!newDayTitle.trim() || !newDayDate) {
      toast.error("Vui lòng nhập tiêu đề và chọn ngày");
      return;
    }
    setSaving(true);
    try {
      await tourInstanceService.addCustomDay(instanceId, { title: newDayTitle.trim(), actualDate: newDayDate });
      toast.success("Thêm ngày mới thành công");
      setAddingDay(false);
      setNewDayTitle("");
      setNewDayDate("");
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
            <DayEditor key={day.id} instanceId={instanceId} day={day} index={idx} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {addingDay ? (
        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Thêm Ngày Mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tiêu đề ngày</label>
              <input className={inputCls} value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)} placeholder="VD: Ngày 1 - Đón khách" />
            </div>
            <div>
              <label className={labelCls}>Ngày diễn ra</label>
              <input type="date" className={inputCls} value={newDayDate} onChange={e => setNewDayDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddingDay(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Huỷ</button>
            <button onClick={handleAddDay} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
              Lưu Ngày
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingDay(true)}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <Icon icon="heroicons:plus" className="size-5" />
          Thêm Ngày Mới
        </button>
      )}
    </div>
  );
}

function DayEditor({ instanceId, day, index, onRefresh }: { instanceId: string, day: TourInstanceDayDto, index: number, onRefresh: () => void }) {
  const [addingAct, setAddingAct] = useState(false);
  
  return (
    <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden bg-white">
      <div className="bg-slate-100/50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Ngày {day.instanceDayNumber}: {day.title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{toDateInput(day.actualDate)}</p>
        </div>
        <button onClick={() => setAddingAct(true)} className="p-2 bg-white rounded-full text-[#fa8b02] border border-slate-200 shadow-sm hover:shadow hover:text-[#fa8b02]/80 transition-all">
          <Icon icon="heroicons:plus" className="size-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {(!day.activities || day.activities.length === 0) ? (
          <p className="text-xs text-slate-400 text-center py-2">Không có hoạt động nào trong ngày này.</p>
        ) : (
          day.activities.map((act) => (
            <ActivityEditor key={act.id} instanceId={instanceId} dayId={day.id} act={act} dayActivities={day.activities} onRefresh={onRefresh} />
          ))
        )}

        {addingAct && (
          <ActivityForm 
            instanceId={instanceId} 
            dayId={day.id} 
            dayActivities={day.activities}
            onCancel={() => setAddingAct(false)} 
            onSuccess={() => { setAddingAct(false); onRefresh(); }} 
          />
        )}
      </div>
    </div>
  );
}

function ActivityEditor({ instanceId, dayId, act, dayActivities, onRefresh }: { instanceId: string, dayId: string, act: TourInstanceDayActivityDto, dayActivities?: TourInstanceDayActivityDto[], onRefresh: () => void }) {
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

      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-50 pl-2">
        <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
          <Icon icon="heroicons:pencil" className="size-4" />
        </button>
        <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
          <Icon icon="heroicons:trash" className="size-4" />
        </button>
      </div>
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

    setSaving(true);
    try {
      if (isEditing) {
        await tourInstanceService.updateInstanceActivity(instanceId, dayId, initialData.id, {
          note,
          startTime: startTime ? `${startTime}:00` : null,
          endTime: endTime ? `${endTime}:00` : null,
          price: price ? Number(price) : null,
        });
        toast.success("Cập nhật hoạt động thành công");
      } else {
        await tourInstanceService.createInstanceActivity(instanceId, dayId, {
          title,
          activityType: Number(actType),
          note,
          startTime: startTime ? `${startTime}:00` : null,
          endTime: endTime ? `${endTime}:00` : null,
          price: price ? Number(price) : null,
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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h4 className="text-sm font-bold text-slate-900">{isEditing ? "Sửa hoạt động" : "Thêm hoạt động mới"}</h4>
      
      {!isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tên hoạt động *</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Tham quan bảo tàng" />
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
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Giờ bắt đầu</label>
          <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Giờ kết thúc</label>
          <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
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
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Huỷ</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
          {isEditing ? "Cập nhật" : "Thêm hoạt động"}
        </button>
      </div>
    </div>
  );
}
