"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";
import {
  getApprovalAppearance,
  normalizeApprovalStatus,
  type ApprovalAppearance,
} from "@/utils/approvalStatusHelper";

/* ── Animation Variants ───────────────────────────────────── */
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 110, damping: 20 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

/* ── Helpers ──────────────────────────────────────────────── */
const inputCls = "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

const ACTIVITY_TYPE_OPTIONS = [
  { value: 0, label: "Tham quan" },
  { value: 1, label: "Ẩm thực" },
  { value: 7, label: "Vận chuyển" },
  { value: 8, label: "Lưu trú" },
  { value: 9, label: "Thời gian tự do" },
  { value: 99, label: "Khác" },
];

const isTransportationActivity = (activityType?: string | null) => {
  const n = activityType?.trim().toLowerCase();
  return n === "transportation" || n === "7";
};

const isAccommodationActivity = (activityType?: string | null) => {
  const n = activityType?.trim().toLowerCase();
  return n === "accommodation" || n === "8";
};

/* ── Approval summary per-activity ────────────────────────── */
interface ApprovalSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  unassigned: number;
}

const buildApprovalSummary = (
  items: Array<{ assigned: boolean; status?: string | null }>,
): ApprovalSummary =>
  items.reduce(
    (sum, item) => {
      sum.total += 1;
      if (!item.assigned) {
        sum.unassigned += 1;
        return sum;
      }
      switch (normalizeApprovalStatus(item.status)) {
        case "approved": sum.approved += 1; break;
        case "rejected": sum.rejected += 1; break;
        default: sum.pending += 1; break;
      }
      return sum;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0, unassigned: 0 },
  );

/* ── Pill component for approval ──────────────────────────── */
function ApprovalPill({ appearance }: { appearance: ApprovalAppearance }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${appearance.ringClassName}`}
    >
      <Icon icon={appearance.icon} className="size-3.5" />
      {appearance.label}
    </span>
  );
}

/* ── Summary bar component ────────────────────────────────── */
function ApprovalSummaryBar({
  label,
  icon,
  summary,
}: {
  label: string;
  icon: string;
  summary: ApprovalSummary;
}) {
  if (summary.total === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
        <Icon icon={icon} className="size-4 text-stone-400" />
        {label}
        <span className="text-stone-400 font-normal">({summary.total})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {summary.approved > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20">
            <Icon icon="heroicons:check-circle" className="size-3.5" />
            {summary.approved} đã duyệt
          </span>
        )}
        {summary.pending > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
            <Icon icon="heroicons:clock" className="size-3.5" />
            {summary.pending} chờ duyệt
          </span>
        )}
        {summary.rejected > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-500/20">
            <Icon icon="heroicons:x-circle" className="size-3.5" />
            {summary.rejected} từ chối
          </span>
        )}
        {summary.unassigned > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 ring-1 ring-slate-500/10">
            <Icon icon="heroicons:information-circle" className="size-3.5" />
            {summary.unassigned} chưa giao
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PrivateTourInstanceDetailPage
   Focused on approval workflow for private tours.
   Shows: tour info, approval summary, itinerary with approval
   status per activity, and link to full management page.
   ══════════════════════════════════════════════════════════════ */

export default function PrivateTourInstanceDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params.id as string;
  const backHref = "/tour-operator/tour-instances/private";
  const editHref = `/tour-operator/tour-instances/private/${id}/edit`;

  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /* ── Editing state ───────────────────────────────────────── */
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [dayEditForm, setDayEditForm] = useState({ title: "", description: "", actualDate: "", startTime: "", endTime: "", note: "" });
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [actEditForm, setActEditForm] = useState({ note: "", startTime: "", endTime: "", isOptional: false });
  const [addingActivityForDayId, setAddingActivityForDayId] = useState<string | null>(null);
  const [newActForm, setNewActForm] = useState({ title: "", activityType: 0, description: "", note: "", startTime: "", endTime: "", isOptional: false });
  const [addingDay, setAddingDay] = useState(false);
  const [newDayForm, setNewDayForm] = useState({ title: "", actualDate: "", description: "" });
  const [saving, setSaving] = useState(false);

  /* ── Load data ───────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setDataState("loading");
      setErrorMessage(null);
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setDataState("ready");
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      setData(null);
      setDataState("error");
      setErrorMessage(apiError.message);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData, reloadToken]);

  /* ── Day CRUD ────────────────────────────────────────────── */
  const startEditDay = (day: { id: string; title: string; description?: string | null; actualDate?: string; startTime?: string | null; endTime?: string | null; note?: string | null }) => {
    setEditingDayId(day.id);
    setEditingActivityId(null);
    setAddingActivityForDayId(null);
    setDayEditForm({ title: day.title ?? "", description: day.description ?? "", actualDate: day.actualDate ? day.actualDate.split("T")[0] : "", startTime: day.startTime ?? "", endTime: day.endTime ?? "", note: day.note ?? "" });
  };

  const saveDay = async () => {
    if (!data || !editingDayId) return;
    setSaving(true);
    try {
      await tourInstanceService.updateInstanceDay(data.id, editingDayId, {
        title: dayEditForm.title, description: dayEditForm.description || null,
        actualDate: dayEditForm.actualDate ? dayEditForm.actualDate + "T00:00:00Z" : "",
        startTime: dayEditForm.startTime || null, endTime: dayEditForm.endTime || null, note: dayEditForm.note || null,
      });
      toast.success("Đã cập nhật ngày");
      setEditingDayId(null);
      setReloadToken((v) => v + 1);
    } catch (e: unknown) { toast.error(handleApiError(e).message); }
    finally { setSaving(false); }
  };

  const saveNewDay = async () => {
    if (!data || !newDayForm.title.trim() || !newDayForm.actualDate) { toast.error("Vui lòng nhập tiêu đề và ngày"); return; }
    setSaving(true);
    try {
      await tourInstanceService.addCustomDay(data.id, { title: newDayForm.title.trim(), actualDate: newDayForm.actualDate + "T00:00:00Z", description: newDayForm.description.trim() || undefined });
      toast.success("Đã thêm ngày mới");
      setAddingDay(false);
      setNewDayForm({ title: "", actualDate: "", description: "" });
      setReloadToken((v) => v + 1);
    } catch (e: unknown) { toast.error(handleApiError(e).message); }
    finally { setSaving(false); }
  };

  /* ── Activity CRUD ───────────────────────────────────────── */
  const startEditActivity = (act: { id: string; note?: string | null; startTime?: string | null; endTime?: string | null; isOptional?: boolean }) => {
    setEditingActivityId(act.id);
    setEditingDayId(null);
    setAddingActivityForDayId(null);
    setActEditForm({ note: act.note ?? "", startTime: act.startTime ?? "", endTime: act.endTime ?? "", isOptional: act.isOptional ?? false });
  };

  const saveActivity = async (dayId: string) => {
    if (!data || !editingActivityId) return;
    setSaving(true);
    try {
      await tourInstanceService.updateInstanceActivity(data.id, dayId, editingActivityId, {
        note: actEditForm.note || null, startTime: actEditForm.startTime || null, endTime: actEditForm.endTime || null, isOptional: actEditForm.isOptional,
      });
      toast.success("Đã cập nhật hoạt động");
      setEditingActivityId(null);
      setReloadToken((v) => v + 1);
    } catch (e: unknown) { toast.error(handleApiError(e).message); }
    finally { setSaving(false); }
  };

  const saveNewActivity = async (dayId: string) => {
    if (!data || !newActForm.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    setSaving(true);
    try {
      await tourInstanceService.createInstanceActivity(data.id, dayId, {
        title: newActForm.title.trim(), activityType: newActForm.activityType,
        description: newActForm.description.trim() || null, note: newActForm.note.trim() || null,
        startTime: newActForm.startTime || null, endTime: newActForm.endTime || null, isOptional: newActForm.isOptional,
      });
      toast.success("Đã thêm hoạt động");
      setAddingActivityForDayId(null);
      setNewActForm({ title: "", activityType: 0, description: "", note: "", startTime: "", endTime: "", isOptional: false });
      setReloadToken((v) => v + 1);
    } catch (e: unknown) { toast.error(handleApiError(e).message); }
    finally { setSaving(false); }
  };

  const deleteActivity = async (dayId: string, activityId: string) => {
    if (!data || !confirm("Bạn có chắc muốn xoá hoạt động này?")) return;
    try {
      await tourInstanceService.deleteInstanceActivity(data.id, dayId, activityId);
      toast.success("Đã xoá hoạt động");
      setReloadToken((v) => v + 1);
    } catch (e: unknown) { toast.error(handleApiError(e).message); }
  };

  /* ── Approval summaries ──────────────────────────────────── */
  const approvalSummary = useMemo(() => {
    const activities = (data?.days ?? []).flatMap((d) => d.activities ?? []);
    return {
      transport: buildApprovalSummary(
        activities
          .filter((a) => isTransportationActivity(a.activityType))
          .map((a) => ({
            assigned: Boolean(a.transportSupplierId || a.transportSupplierName),
            status: a.transportationApprovalStatus,
          })),
      ),
      accommodation: buildApprovalSummary(
        activities
          .filter((a) => isAccommodationActivity(a.activityType))
          .map((a) => ({
            assigned: Boolean(a.accommodation?.supplierId || a.accommodation?.supplierName),
            status: a.accommodation?.supplierApprovalStatus,
          })),
      ),
    };
  }, [data]);

  /* ── Loading ──────────────────────────────────────────────── */
  if (dataState === "loading") {
    return (
      <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
        <SkeletonCard lines={4} />
      </main>
    );
  }

  /* ── Error ────────────────────────────────────────────────── */
  if (dataState === "error" || !data) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-md">
          <Icon icon="heroicons:exclamation-circle" className="mx-auto mb-3 size-12 text-red-400" />
          <p className="text-base font-semibold text-stone-900">Không thể tải thông tin tour</p>
          {errorMessage && <p className="mt-2 text-sm text-stone-500">{errorMessage}</p>}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              Thử lại
            </button>
            <Link
              href={backHref}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Quay lại
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Ready ────────────────────────────────────────────────── */
  return (
    <main className="py-8 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <motion.nav
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 text-sm text-stone-500"
        aria-label="Breadcrumb"
      >
        <Link
          href={backHref}
          className="flex items-center gap-1.5 hover:text-stone-900 transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          Tour Riêng Tư
        </Link>
        <Icon icon="heroicons:chevron-right" className="size-3.5" />
        <span className="text-stone-900 font-medium truncate max-w-[30ch]">
          {data.title || data.tourName}
        </span>
      </motion.nav>

      {/* ── Header ───────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row md:items-start gap-5"
      >
        {/* Thumbnail */}
        <div className="w-full md:w-40 h-32 md:h-28 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60 shrink-0">
          {data.thumbnail?.publicURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.thumbnail.publicURL}
              alt={data.title || data.tourName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <Icon icon="heroicons:photo" className="size-10" />
            </div>
          )}
        </div>

        {/* Title & meta */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 leading-tight flex-1">
              {data.title || data.tourName}
            </h1>
            <TourStatusBadge status={data.status} />
          </div>
          <p className="text-sm text-stone-400 font-mono">{data.tourInstanceCode}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600 mt-1">
            <span className="flex items-center gap-1.5">
              <Icon icon="heroicons:calendar" className="size-4 text-stone-400" />
              {formatDate(data.startDate)} — {formatDate(data.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon="heroicons:clock" className="size-4 text-stone-400" />
              {data.durationDays} ngày
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon="heroicons:user-group" className="size-4 text-stone-400" />
              {data.currentParticipation ?? 0}/{data.maxParticipation} khách
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon="heroicons:map-pin" className="size-4 text-stone-400" />
              {data.location || "N/A"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Approval Summary Cards ────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2"
      >
        <motion.div variants={itemVariants}>
          <ApprovalSummaryBar
            label="Vận tải"
            icon="heroicons:truck"
            summary={approvalSummary.transport}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ApprovalSummaryBar
            label="Lưu trú"
            icon="heroicons:building-office-2"
            summary={approvalSummary.accommodation}
          />
        </motion.div>
      </motion.div>

      {/* ── Customization Notes ───────────────────────────────── */}
      {data.customizationNotes && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
            <Icon icon="heroicons:chat-bubble-left-ellipsis" className="size-4" />
            Ghi chú tuỳ chỉnh từ khách
          </div>
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
            {data.customizationNotes}
          </p>
        </motion.div>
      )}

      {/* ── Itinerary (focused on approval) ───────────────────── */}
      {data.days && data.days.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Lịch trình ({data.days.length} ngày)
            </h2>
            <button
              onClick={() => { setAddingDay(true); setEditingDayId(null); setEditingActivityId(null); setAddingActivityForDayId(null); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 active:scale-[0.97] transition-all shadow-sm"
            >
              <Icon icon="heroicons:plus" className="size-4" />
              Thêm ngày
            </button>
          </div>

          {/* Add Day Form */}
          <AnimatePresence>
            {addingDay && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white border border-amber-200 rounded-2xl p-5 space-y-3 overflow-hidden">
                <p className="text-sm font-semibold text-stone-800">Thêm ngày mới</p>
                <input className={inputCls} placeholder="Tiêu đề ngày *" value={newDayForm.title} onChange={(e) => setNewDayForm((f) => ({ ...f, title: e.target.value }))} />
                <input type="date" className={inputCls} value={newDayForm.actualDate} onChange={(e) => setNewDayForm((f) => ({ ...f, actualDate: e.target.value }))} />
                <textarea className={inputCls} rows={2} placeholder="Mô tả (tuỳ chọn)" value={newDayForm.description} onChange={(e) => setNewDayForm((f) => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveNewDay} disabled={saving} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all">{saving ? "Đang lưu..." : "Thêm"}</button>
                  <button onClick={() => setAddingDay(false)} className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">Huỷ</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {data.days.map((day, dayIdx) => (
            <motion.div
              key={day.id ?? dayIdx}
              variants={itemVariants}
              className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden"
            >
              {/* Day header */}
              <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {dayIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-stone-900 truncate">{day.title}</h3>
                  {day.actualDate && <p className="text-xs text-stone-500">{formatDate(day.actualDate)}</p>}
                </div>
                <button onClick={() => startEditDay(day)} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Sửa ngày">
                  <Icon icon="heroicons:pencil-square" className="size-4" />
                </button>
              </div>

              {/* Day edit form */}
              <AnimatePresence>
                {editingDayId === day.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 py-4 border-b border-amber-100 bg-amber-50/30 space-y-3 overflow-hidden">
                    <input className={inputCls} placeholder="Tiêu đề" value={dayEditForm.title} onChange={(e) => setDayEditForm((f) => ({ ...f, title: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" className={inputCls} value={dayEditForm.actualDate} onChange={(e) => setDayEditForm((f) => ({ ...f, actualDate: e.target.value }))} />
                      <textarea className={inputCls} rows={1} placeholder="Ghi chú" value={dayEditForm.note} onChange={(e) => setDayEditForm((f) => ({ ...f, note: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveDay} disabled={saving} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu"}</button>
                      <button onClick={() => setEditingDayId(null)} className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">Huỷ</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Activities */}
              {day.activities && day.activities.length > 0 && (
                <div className="divide-y divide-stone-100">
                  {day.activities.map((act, aIdx) => {
                    const isTransport = isTransportationActivity(act.activityType);
                    const isAccomm = isAccommodationActivity(act.activityType);
                    const hasApproval = isTransport || isAccomm;

                    let approvalAppearance: ApprovalAppearance | null = null;
                    let supplierName: string | null = null;

                    if (isTransport) {
                      approvalAppearance = getApprovalAppearance(act.transportationApprovalStatus);
                      supplierName = act.transportSupplierName ?? null;
                    } else if (isAccomm) {
                      approvalAppearance = getApprovalAppearance(act.accommodation?.supplierApprovalStatus);
                      supplierName = act.accommodation?.supplierName ?? null;
                    }

                    return (
                      <React.Fragment key={act.id ?? aIdx}>
                      <div
                        className={`px-5 py-4 flex items-start gap-3 group/act ${
                          hasApproval ? "bg-stone-50/50" : ""
                        }`}
                      >
                        <Icon
                          icon={
                            isTransport
                              ? "heroicons:truck"
                              : isAccomm
                                ? "heroicons:building-office-2"
                                : "heroicons:bolt"
                          }
                          className={`size-5 mt-0.5 shrink-0 ${
                            isTransport
                              ? "text-blue-500"
                              : isAccomm
                                ? "text-purple-500"
                                : "text-amber-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-stone-900">
                              {act.title}
                            </p>
                            {hasApproval && approvalAppearance && (
                              <ApprovalPill appearance={approvalAppearance} />
                            )}
                          </div>

                          {/* Supplier info */}
                          {supplierName && (
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Icon icon="heroicons:building-storefront" className="size-3.5" />
                              NCC: {supplierName}
                            </p>
                          )}

                          {/* Transport-specific details */}
                          {isTransport && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                              {act.requestedVehicleType && (
                                <span>Loại xe: {act.requestedVehicleType}</span>
                              )}
                              {act.requestedSeatCount && (
                                <span>Số ghế: {act.requestedSeatCount}</span>
                              )}
                              {act.requestedVehicleCount && (
                                <span>Số xe: {act.requestedVehicleCount}</span>
                              )}
                            </div>
                          )}

                          {/* Accommodation-specific details */}
                          {isAccomm && act.accommodation && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                              {act.accommodation.roomType && (
                                <span>Loại phòng: {act.accommodation.roomType}</span>
                              )}
                              {act.accommodation.quantity && (
                                <span>Số phòng: {act.accommodation.quantity}</span>
                              )}
                            </div>
                          )}

                          {/* Approval note */}
                          {isTransport && act.transportationApprovalNote && (
                            <p className="text-xs text-stone-500 italic mt-1">
                              Ghi chú: {act.transportationApprovalNote}
                            </p>
                          )}
                          {isAccomm && act.accommodation?.supplierApprovalNote && (
                            <p className="text-xs text-stone-500 italic mt-1">
                              Ghi chú: {act.accommodation.supplierApprovalNote}
                            </p>
                          )}

                          {act.note && !isTransport && !isAccomm && (
                            <p className="text-xs text-stone-500">{act.note}</p>
                          )}
                        </div>

                        {/* Time */}
                        {(act.startTime || act.endTime) && (
                          <span className="text-xs text-stone-400 whitespace-nowrap shrink-0">
                            {act.startTime ?? ""} {act.startTime && act.endTime ? "—" : ""} {act.endTime ?? ""}
                          </span>
                        )}

                        {/* Edit/Delete buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/act:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); startEditActivity(act); }} className="p-1 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50" title="Sửa">
                            <Icon icon="heroicons:pencil-square" className="size-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteActivity(day.id, act.id); }} className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50" title="Xoá">
                            <Icon icon="heroicons:trash" className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Activity edit form */}
                      <AnimatePresence>
                        {editingActivityId === act.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 py-3 border-t border-amber-100 bg-amber-50/20 space-y-3 overflow-hidden">
                            <div className="grid grid-cols-2 gap-3">
                              <input type="time" className={inputCls} placeholder="Giờ bắt đầu" value={actEditForm.startTime} onChange={(e) => setActEditForm((f) => ({ ...f, startTime: e.target.value }))} />
                              <input type="time" className={inputCls} placeholder="Giờ kết thúc" value={actEditForm.endTime} onChange={(e) => setActEditForm((f) => ({ ...f, endTime: e.target.value }))} />
                            </div>
                            <textarea className={inputCls} rows={2} placeholder="Ghi chú" value={actEditForm.note} onChange={(e) => setActEditForm((f) => ({ ...f, note: e.target.value }))} />
                            <label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" checked={actEditForm.isOptional} onChange={(e) => setActEditForm((f) => ({ ...f, isOptional: e.target.checked }))} className="size-4 rounded border-stone-300 text-amber-500" /> Tuỳ chọn</label>
                            <div className="flex gap-2">
                              <button onClick={() => saveActivity(day.id)} disabled={saving} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu"}</button>
                              <button onClick={() => setEditingActivityId(null)} className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">Huỷ</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {(!day.activities || day.activities.length === 0) && (
                <div className="px-5 py-6 text-center text-sm text-stone-400">
                  Chưa có hoạt động
                </div>
              )}

              {/* Add activity button */}
              <div className="px-5 py-3 border-t border-stone-100">
                <button
                  onClick={() => { setAddingActivityForDayId(day.id); setEditingDayId(null); setEditingActivityId(null); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Icon icon="heroicons:plus-circle" className="size-4" />
                  Thêm hoạt động
                </button>
              </div>

              {/* Add activity form */}
              <AnimatePresence>
                {addingActivityForDayId === day.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 py-4 border-t border-amber-100 bg-amber-50/20 space-y-3 overflow-hidden">
                    <p className="text-sm font-semibold text-stone-800">Thêm hoạt động mới</p>
                    <input className={inputCls} placeholder="Tiêu đề *" value={newActForm.title} onChange={(e) => setNewActForm((f) => ({ ...f, title: e.target.value }))} />
                    <select className={inputCls} value={newActForm.activityType} onChange={(e) => setNewActForm((f) => ({ ...f, activityType: Number(e.target.value) }))}>
                      {ACTIVITY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <textarea className={inputCls} rows={2} placeholder="Mô tả" value={newActForm.description} onChange={(e) => setNewActForm((f) => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="time" className={inputCls} placeholder="Giờ bắt đầu" value={newActForm.startTime} onChange={(e) => setNewActForm((f) => ({ ...f, startTime: e.target.value }))} />
                      <input type="time" className={inputCls} placeholder="Giờ kết thúc" value={newActForm.endTime} onChange={(e) => setNewActForm((f) => ({ ...f, endTime: e.target.value }))} />
                    </div>
                    <textarea className={inputCls} rows={1} placeholder="Ghi chú" value={newActForm.note} onChange={(e) => setNewActForm((f) => ({ ...f, note: e.target.value }))} />
                    <div className="flex gap-2">
                      <button onClick={() => saveNewActivity(day.id)} disabled={saving} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">{saving ? "Đang lưu..." : "Thêm"}</button>
                      <button onClick={() => setAddingActivityForDayId(null)} className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">Huỷ</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Action buttons ────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        <Link
          href={editHref}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-white text-sm font-semibold transition-all hover:bg-amber-600 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
        >
          <Icon icon="heroicons:pencil-square" className="size-5" />
          Chỉnh sửa &amp; Gửi Manager duyệt
        </Link>
        <Link
          href={backHref}
          className="flex-1 flex items-center justify-center py-3.5 rounded-2xl border border-stone-200/80 bg-white text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98]"
        >
          Quay lại danh sách
        </Link>
      </motion.div>
    </main>
  );
}
