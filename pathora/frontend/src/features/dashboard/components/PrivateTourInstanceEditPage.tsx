"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  tourInstanceService,
  type UpdateTourInstancePayload,
} from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

/* ── helpers ──────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow";

const labelCls = "block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide";

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
  includedServices: string[];
  operatorNote: string; // sent as a note to Manager
}

const fromDto = (data: NormalizedTourInstanceDto): EditForm => ({
  title: data.title ?? "",
  startDate: toDateInput(data.startDate),
  endDate: toDateInput(data.endDate),
  location: data.location ?? "",
  maxParticipation: String(data.maxParticipation ?? 0),
  confirmationDeadline: toDateInput(data.confirmationDeadline),
  includedServices:
    data.includedServices && data.includedServices.length > 0
      ? data.includedServices
      : [""],
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

  const detailHref = `/tour-operator/tour-instances/private/${id}`;
  const listHref = "/tour-operator/tour-instances/private";

  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({});

  /* ── load ─────────────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setDataState("loading");
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setForm(detail ? fromDto(detail) : null);
      setDataState("ready");
    } catch (e: unknown) {
      setDataState("error");
      setErrorMessage(handleApiError(e).message);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ── field helpers ────────────────────────────────────────── */
  const set = <K extends keyof EditForm>(key: K, val: EditForm[K]) => {
    setForm((f) => f ? { ...f, [key]: val } : f);
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const setService = (idx: number, val: string) =>
    setForm((f) => {
      if (!f) return f;
      const items = [...f.includedServices];
      items[idx] = val;
      return { ...f, includedServices: items };
    });

  const addService = () =>
    setForm((f) => f ? { ...f, includedServices: [...f.includedServices, ""] } : f);

  const removeService = (idx: number) =>
    setForm((f) => {
      if (!f) return f;
      return { ...f, includedServices: f.includedServices.filter((_, i) => i !== idx) };
    });

  /* ── validate ─────────────────────────────────────────────── */
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
    return Object.keys(errs).length === 0;
  };

  /* ── save ─────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!data || !form || !validate()) return;
    setSaving(true);
    try {
      const services = form.includedServices.map((s) => s.trim()).filter(Boolean);
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
        includedServices: services.length > 0 ? services : undefined,
        guideUserIds: (data.managers ?? [])
          .filter((m) => m.role === "Guide")
          .map((m) => m.userId),
        managerUserIds: (data.managers ?? [])
          .filter((m) => m.role === "Manager")
          .map((m) => m.userId),
        thumbnailUrl: data.thumbnail?.publicURL ?? null,
      };

      await tourInstanceService.updateInstance(payload);
      toast.success("Đã lưu thay đổi thành công! Manager sẽ xem xét và duyệt.");
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

  /* ── loading ──────────────────────────────────────────────── */
  if (dataState === "loading") {
    return (
      <main className="py-8 px-4 md:px-6 max-w-3xl mx-auto space-y-5">
        <SkeletonCard />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </main>
    );
  }

  /* ── error ────────────────────────────────────────────────── */
  if (dataState === "error" || !data || !form) {
    return (
      <main className="py-12 px-4">
        <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-10 text-center shadow">
          <Icon icon="heroicons:exclamation-circle" className="mx-auto mb-3 size-12 text-red-400" />
          <p className="font-semibold text-stone-900">Không thể tải dữ liệu tour</p>
          {errorMessage && <p className="mt-1 text-sm text-stone-500">{errorMessage}</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={loadData} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">Thử lại</button>
            <Link href={listHref} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50">Quay lại</Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── ready ────────────────────────────────────────────────── */
  return (
    <main className="py-8 px-4 md:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">

      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-stone-500"
      >
        <Link href={listHref} className="hover:text-stone-900 transition-colors flex items-center gap-1.5">
          <Icon icon="heroicons:arrow-left" className="size-4" />
          Tour Riêng Tư
        </Link>
        <Icon icon="heroicons:chevron-right" className="size-3.5" />
        <Link href={detailHref} className="hover:text-stone-900 transition-colors truncate max-w-[20ch]">
          {data.title || data.tourName}
        </Link>
        <Icon icon="heroicons:chevron-right" className="size-3.5" />
        <span className="text-stone-900 font-medium">Chỉnh sửa</span>
      </motion.nav>

      {/* Header banner */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Icon icon="heroicons:pencil-square" className="size-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">Chỉnh sửa thông tin tour</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Sau khi lưu, Manager sẽ được thông báo và xem xét các thay đổi để duyệt.
          </p>
        </div>
        <TourStatusBadge status={data.status} />
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-2xl border border-stone-200/60 bg-white shadow-sm overflow-hidden"
      >
        {/* Section: Basic info */}
        <div className="px-6 py-5 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Thông tin cơ bản</h2>
        </div>
        <div className="px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className={labelCls}>Tiêu đề tour *</label>
            <input
              className={`${inputCls} ${errors.title ? "border-red-300 ring-1 ring-red-200" : ""}`}
              placeholder="VD: Private — Nhật Bản 5 ngày"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ngày bắt đầu *</label>
              <input
                type="date"
                className={`${inputCls} ${errors.startDate ? "border-red-300 ring-1 ring-red-200" : ""}`}
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
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
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Location + Max participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {errors.maxParticipation && <p className="mt-1 text-xs text-red-500">{errors.maxParticipation}</p>}
            </div>
          </div>

          {/* Confirmation deadline */}
          <div>
            <label className={labelCls}>Hạn xác nhận</label>
            <input
              type="date"
              className={inputCls}
              value={form.confirmationDeadline}
              max={form.startDate}
              onChange={(e) => set("confirmationDeadline", e.target.value)}
            />
            <p className="mt-1 text-xs text-stone-400">Thời hạn khách phải xác nhận đặt tour</p>
          </div>

        </div>

        {/* Section: Included services */}
        <div className="px-6 py-5 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Dịch vụ bao gồm</h2>
            <button
              onClick={addService}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <Icon icon="heroicons:plus-circle" className="size-4" />
              Thêm
            </button>
          </div>
          <div className="space-y-2.5">
            {form.includedServices.map((svc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  placeholder={`Dịch vụ ${idx + 1} (VD: Vé máy bay khứ hồi)`}
                  value={svc}
                  onChange={(e) => setService(idx, e.target.value)}
                />
                {form.includedServices.length > 1 && (
                  <button
                    onClick={() => removeService(idx)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Icon icon="heroicons:trash" className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section: Operator note to Manager */}
        <div className="px-6 py-5 border-t border-stone-100">
          <label className={labelCls}>Ghi chú gửi Manager (tuỳ chọn)</label>
          <textarea
            className={inputCls}
            rows={4}
            placeholder="VD: Đã cập nhật lịch trình theo yêu cầu khách. Mong Manager xem xét và duyệt sớm."
            value={form.operatorNote}
            onChange={(e) => set("operatorNote", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-stone-400">
            Ghi chú này sẽ giúp Manager hiểu lý do chỉnh sửa.
          </p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row gap-3 pb-8"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-white text-sm font-semibold transition-all hover:bg-amber-600 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {saving ? (
            <>
              <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Icon icon="heroicons:paper-airplane" className="size-5" />
              Lưu &amp; Gửi Manager duyệt
            </>
          )}
        </button>
        <Link
          href={detailHref}
          className="flex-1 flex items-center justify-center py-3.5 rounded-2xl border border-stone-200/80 bg-white text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98]"
        >
          Huỷ
        </Link>
      </motion.div>
    </main>
  );
}
