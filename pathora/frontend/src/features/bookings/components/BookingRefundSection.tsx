"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { HandCoins, PhoneCall, CheckCircle, Clock } from "@phosphor-icons/react";

import { bookingService } from "@/api/services/bookingService";
import { handleApiError } from "@/utils/apiResponse";
import { useAuth } from "@/contexts/AuthContext";
import type { RefundStatusString } from "@/types/booking";

interface BookingRefundSectionProps {
  bookingId: string;
  bookingStatus?: string;
  refundStatus?: RefundStatusString;
  refundOutstandingAmount?: number | null;
  refundContactedAt?: string | null;
  refundCompletedAt?: string | null;
  onChanged?: () => void | Promise<void>;
}

const statusTone: Record<RefundStatusString, string> = {
  Pending: "bg-orange-50 text-orange-700 border-orange-200",
  Contacted: "bg-blue-50 text-blue-700 border-blue-200",
  Refunded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NotApplicable: "bg-stone-50 text-stone-600 border-stone-200",
};

export function BookingRefundSection({
  bookingId,
  bookingStatus,
  refundStatus,
  refundOutstandingAmount,
  refundContactedAt,
  refundCompletedAt,
  onChanged,
}: BookingRefundSectionProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<"Contacted" | "Refunded" | null>(null);
  const dateLocale = i18n.language === "vi" ? vi : enUS;

  if (!refundStatus) return null;
  const isCancelled = (bookingStatus || "").toLowerCase() === "cancelled";
  if (!isCancelled && refundStatus === "NotApplicable") return null;

  const canAct = user?.roles?.some(
    (r) => r.name === "Admin" || r.name === "Manager",
  );

  const callApi = async (next: "Contacted" | "Refunded") => {
    setSubmitting(next);
    try {
      await bookingService.updateRefundStatus(bookingId, next);
      toast.success(
        next === "Contacted"
          ? t("refundTracking.action.markedContacted", "Đã ghi nhận liên hệ.")
          : t("refundTracking.action.markedRefunded", "Đã ghi nhận hoàn tiền."),
      );
      await Promise.resolve(onChanged?.());
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, t("refundTracking.errorGeneric", "Không cập nhật được trạng thái hoàn tiền.")),
      );
    } finally {
      setSubmitting(null);
    }
  };

  const formatVnd = (v: number) => `${v.toLocaleString("vi-VN")}đ`;
  const formatDt = (v?: string | null) =>
    v ? format(new Date(v), "dd MMM yyyy HH:mm", { locale: dateLocale }) : "—";

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-orange-50 text-orange-600 center">
          <HandCoins size={20} weight="fill" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          {t("refundTracking.section.title", "Trạng thái hoàn tiền")}
        </h3>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">
            {t("refundTracking.col.status", "Trạng thái")}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[refundStatus]}`}>
            {t(`refundTracking.status.${refundStatus}`, refundStatus)}
          </span>
        </div>

        {typeof refundOutstandingAmount === "number" && refundOutstandingAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("refundTracking.col.outstanding", "Cần hoàn (70%)")}
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {formatVnd(refundOutstandingAmount)}
            </span>
          </div>
        )}

        {refundContactedAt && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("refundTracking.col.contactedAt", "Đã liên hệ lúc")}
            </span>
            <span className="text-slate-700">{formatDt(refundContactedAt)}</span>
          </div>
        )}

        {refundCompletedAt && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {t("refundTracking.col.completedAt", "Đã hoàn lúc")}
            </span>
            <span className="text-slate-700">{formatDt(refundCompletedAt)}</span>
          </div>
        )}
      </div>

      {canAct && isCancelled && refundStatus !== "Refunded" && refundStatus !== "NotApplicable" && (
        <div className="mt-6 flex flex-wrap gap-2">
          {refundStatus === "Pending" && (
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => void callApi("Contacted")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              <PhoneCall size={16} weight="fill" />
              {submitting === "Contacted"
                ? t("common.processing", "Đang xử lý...")
                : t("refundTracking.action.markContacted", "Đã liên hệ")}
            </button>
          )}
          {refundStatus === "Contacted" && (
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => void callApi("Refunded")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              <CheckCircle size={16} weight="fill" />
              {submitting === "Refunded"
                ? t("common.processing", "Đang xử lý...")
                : t("refundTracking.action.markRefunded", "Đã hoàn tiền")}
            </button>
          )}
        </div>
      )}

      {!canAct && refundStatus === "Pending" && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Clock size={14} />
          <span>
            {t(
              "refundTracking.waitingContact",
              "Hệ thống sẽ liên hệ bạn qua điện thoại để hoàn 70% số tiền đã thanh toán.",
            )}
          </span>
        </div>
      )}
    </div>
  );
}
