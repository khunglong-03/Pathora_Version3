"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";
import { isAxiosError } from "axios";

/* ── Status constants (matching backend TourInstanceStatus enum) ── */
const STATUS_DRAFT = "Draft";
const STATUS_PENDING_ADJUSTMENT = 9;  // PendingAdjustment
const STATUS_CANCELLED = 6;           // Cancelled

/* ── Animation Variants ───────────────────────────────────── */
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

/* ── Helpers ──────────────────────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " ₫";

export interface CustomTourRequestDetailPageProps {
  role?: "manager" | "tour-operator";
}

export default function CustomTourRequestDetailPage({
  role = "manager",
}: CustomTourRequestDetailPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /* ── Approve / Reject state ──────────────────────────────── */
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isDraft = data?.status?.toLowerCase() === STATUS_DRAFT.toLowerCase();
  const canManagerAct = role === "manager" && isDraft;

  const handleApprove = useCallback(async () => {
    if (!id) return;
    setActionLoading("approve");
    setActionError(null);
    setActionSuccess(null);
    try {
      await tourInstanceService.changeStatus(id, STATUS_PENDING_ADJUSTMENT);
      setActionSuccess("Yêu cầu đã được duyệt và chuyển cho Tour Operator xử lý.");
      // Reload data to reflect new status
      setReloadToken((v) => v + 1);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setActionError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để thực hiện thao tác này.");
      } else {
        const apiError = handleApiError(error);
        setActionError(apiError.message || "Không thể duyệt yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const handleReject = useCallback(async () => {
    if (!id) return;
    setActionLoading("reject");
    setActionError(null);
    setActionSuccess(null);
    try {
      await tourInstanceService.changeStatus(id, STATUS_CANCELLED);
      setActionSuccess("Yêu cầu đã bị từ chối.");
      setShowRejectModal(false);
      setRejectReason("");
      setReloadToken((v) => v + 1);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setActionError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để thực hiện thao tác này.");
      } else {
        const apiError = handleApiError(error);
        setActionError(apiError.message || "Không thể từ chối yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const backHref =
    role === "tour-operator"
      ? "/tour-operator/custom-tour-requests"
      : "/manager/dashboard/custom-tour-requests";

  // instanceHref is computed lazily after data loads — depends on wantsCustomization flag
  const instanceHref = useMemo(() => {
    if (role !== "tour-operator") return `/manager/tour-instances/${id}`;
    // wantsCustomization=true → operator must edit itinerary before confirming
    // wantsCustomization=false/null → customer already confirmed, just view detail
    return data?.wantsCustomization
      ? `/tour-operator/tour-instances/private/${id}/edit`
      : `/tour-operator/tour-instances/private/${id}`;
  }, [role, id, data?.wantsCustomization]);

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

  const parsedRequests = useMemo(() => {
    if (!data?.customizationNotes) return [];
    return data.customizationNotes
      .split("\n")
      .map((line) => line.trim().replace(/^[-*\u2022]\s*/, "").replace(/^\d+\.\s*/, ""))
      .filter((line) => line.length > 0);
  }, [data?.customizationNotes]);

  /* ── Loading ──────────────────────────────────────────────── */
  if (dataState === "loading") {
    return (
      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
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
        <div className="mx-auto max-w-xl rounded-[2.5rem] border border-stone-200 bg-white p-10 text-center shadow-md">
          <Icon
            icon="heroicons:exclamation-circle"
            className="mx-auto mb-3 size-12 text-red-400"
          />
          <p className="text-base font-semibold text-stone-900">
            Không thể tải thông tin yêu cầu
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm text-stone-500">{errorMessage}</p>
          )}
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
  const content = (
    <main className="py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <motion.nav
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 text-sm text-slate-500 mb-8"
        aria-label="Breadcrumb"
      >
        <Link
          href={backHref}
          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          Custom Tour Requests
        </Link>
        <Icon icon="heroicons:chevron-right" className="size-3.5" />
        <span className="text-slate-900 font-medium truncate max-w-[30ch]">
          {data.title || data.tourName}
        </span>
      </motion.nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ── Left Column: Main Content ───────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="xl:col-span-8 space-y-10 min-w-0"
        >
          {/* Customization Requests (Moved to top) */}
          {parsedRequests.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                  <Icon icon="heroicons:chat-bubble-left-ellipsis" className="size-6" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Yêu cầu từ khách hàng
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Khách hàng có {parsedRequests.length} yêu cầu chỉnh sửa cho lịch trình này
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4">
                {parsedRequests.map((req, idx) => (
                  <div key={idx} className="bg-amber-50/50 border border-amber-100/80 rounded-[1.5rem] p-5 md:p-6 flex items-start gap-4 transition-all hover:bg-amber-50 hover:shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 shadow-sm">
                      {idx + 1}
                    </div>
                    <p className="text-base text-slate-800 leading-relaxed pt-1">
                      {req}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Hero Image & Title */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="w-full h-[300px] md:h-[400px] bg-slate-100 relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              {data.thumbnail?.publicURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.thumbnail.publicURL}
                  alt={data.title || data.tourName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Icon icon="heroicons:photo" className="size-20" />
                </div>
              )}
              {/* Status badge overlay */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 shadow-sm rounded-full bg-white/80 backdrop-blur-md">
                <TourStatusBadge status={data.status} />
              </div>
            </div>

            <div className="px-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-tight">
                {data.title || data.tourName}
              </h1>
              <p className="text-base text-slate-500 font-mono mt-3">
                {data.tourInstanceCode}
              </p>
            </div>
          </motion.div>

          {/* Itinerary */}
          {data.days && data.days.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 px-2">
                Lịch trình ({data.days.length} ngày)
              </h2>
              <div className="space-y-4">
                {data.days.map((day, idx) => (
                  <div
                    key={day.id ?? idx}
                    className="bg-white border border-slate-200/60 rounded-[1.5rem] p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                          {day.title}
                        </h3>
                        {day.actualDate && (
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDate(day.actualDate)}
                          </p>
                        )}
                        {day.description && (
                          <p className="text-base text-slate-600 mt-3 leading-relaxed max-w-[65ch]">
                            {day.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {day.activities && day.activities.length > 0 && (
                      <div className="ml-14 mt-6 space-y-3">
                        {day.activities.map((act, aIdx) => (
                          <div
                            key={act.id ?? aIdx}
                            className="flex items-start gap-3 bg-slate-50 rounded-xl p-4"
                          >
                            <Icon
                              icon="heroicons:bolt"
                              className="size-5 text-[#fa8b02] mt-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-base font-medium text-slate-900">
                                {act.title}
                              </p>
                              {act.note && (
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                  {act.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right Column: Sidebar ───────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="xl:col-span-4 space-y-6 xl:sticky xl:top-8"
        >
          {/* Info Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[2rem] border border-slate-200/60 p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-8"
          >
            <div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                Thông tin tour
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {[
                {
                  icon: "heroicons:calendar",
                  label: "Khởi hành",
                  value: formatDate(data.startDate),
                },
                {
                  icon: "heroicons:calendar-days",
                  label: "Kết thúc",
                  value: formatDate(data.endDate),
                },
                {
                  icon: "heroicons:clock",
                  label: "Thời gian",
                  value: `${data.durationDays} ngày`,
                },
                {
                  icon: "heroicons:user-group",
                  label: "Số khách",
                  value: `${data.currentParticipation ?? 0}/${data.maxParticipation}`,
                },
                {
                  icon: "heroicons:map-pin",
                  label: "Địa điểm",
                  value: data.location || "N/A",
                },
                {
                  icon: "heroicons:banknotes",
                  label: "Giá cơ bản",
                  value: formatCurrency(data.basePrice ?? 0),
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Icon icon={icon} className="size-3.5" />
                    {label}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Included services */}
            {data.includedServices && data.includedServices.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Dịch vụ bao gồm
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.includedServices.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Final Price */}
            {data.finalSellPrice != null && (
              <div className="pt-6 border-t border-slate-100">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                      Giá chốt (Co-design)
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(data.finalSellPrice)}
                    </p>
                  </div>
                  <Icon
                    icon="heroicons:check-badge"
                    className="size-10 text-emerald-500/20"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Manager Approval Actions ─────────────────────── */}
          {canManagerAct && (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-[2rem] border border-slate-200/60 p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6"
            >
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Xử lý yêu cầu
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-[65ch]">
                  Duyệt yêu cầu để chuyển cho Tour Operator lên lịch trình chi tiết,
                  hoặc từ chối nếu không phù hợp.
                </p>
              </div>

              {/* Status feedback */}
              <AnimatePresence mode="wait">
                {actionSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3"
                  >
                    <Icon icon="heroicons:check-circle" className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-emerald-800 font-medium">{actionSuccess}</p>
                  </motion.div>
                )}
                {actionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3"
                  >
                    <Icon icon="heroicons:exclamation-triangle" className="size-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{actionError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-emerald-600 text-white text-base font-semibold transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0"
                >
                  {actionLoading === "approve" ? (
                    <>
                      <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons:check-circle" className="size-5" />
                      Duyệt yêu cầu
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] border border-red-200 bg-white text-red-600 text-base font-semibold transition-all hover:bg-red-50 hover:border-red-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
                >
                  <Icon icon="heroicons:x-circle" className="size-5" />
                  Từ chối yêu cầu
                </button>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Link
              href={instanceHref}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] bg-[#fa8b02] text-white text-base font-semibold transition-all hover:bg-[#e07d02] hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
            >
              {role === "tour-operator" && data?.wantsCustomization ? (
                <>
                  <Icon icon="heroicons:pencil-square" className="size-5" />
                  Chỉnh sửa &amp; Gửi Manager duyệt
                </>
              ) : (
                <>
                  <Icon icon="heroicons:eye" className="size-5" />
                  Xem chi tiết tour
                </>
              )}
            </Link>
            <Link
              href={backHref}
              className="w-full flex items-center justify-center py-4 rounded-[1.5rem] border border-slate-200/80 bg-white text-base font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
            >
              Quay lại danh sách
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );

  /* ── Reject Reason Modal ─────────────────────────────────── */
  return (
    <>
      {content}

      {/* Reject Modal Overlay */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setShowRejectModal(false)}
            role="dialog"
            aria-labelledby="reject-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-[1.5rem] shadow-xl max-w-md w-full p-6 md:p-8 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 id="reject-modal-title" className="text-xl font-semibold text-slate-900 tracking-tight">
                  Từ chối yêu cầu
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Vui lòng nhập lý do từ chối để thông báo cho khách hàng.
                </p>
              </div>

              <div>
                <label htmlFor="reject-reason" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Lý do từ chối
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none transition-all"
                />
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                  <Icon icon="heroicons:exclamation-triangle" className="size-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{actionError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setActionError(null);
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {actionLoading === "reject" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    "Xác nhận từ chối"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
