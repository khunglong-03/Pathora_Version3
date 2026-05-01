"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ChatCircleText, MapTrifold } from "@phosphor-icons/react";
import {
  tourInstanceService,
  type TourItineraryFeedbackDto,
} from "@/api/services/tourInstanceService";
import type { TourInstanceDayDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { paymentService } from "@/api/services/paymentService";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";

export interface PrivateTourCoDesignCustomerSectionProps {
  tourInstanceId: string;
  bookingId: string;
  days: TourInstanceDayDto[];
  finalSellPrice?: number | null;
  tourStatus?: string;
}

function fmtVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PrivateTourCoDesignCustomerSection({
  tourInstanceId,
  bookingId,
  days,
  finalSellPrice,
  tourStatus,
}: PrivateTourCoDesignCustomerSectionProps) {
  const { t } = useTranslation();
  const sortedDays = useMemo(
    () => [...(days ?? [])].sort((a, b) => a.instanceDayNumber - b.instanceDayNumber),
    [days],
  );
  const [activeDayId, setActiveDayId] = useState<string | null>(sortedDays[0]?.id ?? null);
  const [items, setItems] = useState<TourItineraryFeedbackDto[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [paying, setPaying] = useState(false);
  const router = useRouter();
  const [feedbackFetchError, setFeedbackFetchError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (sortedDays.length && !activeDayId) {
      setActiveDayId(sortedDays[0].id);
    }
  }, [sortedDays, activeDayId]);

  const loadFeedback = useCallback(async () => {
    if (!activeDayId) return;
    setLoadingFeedback(true);
    setFeedbackFetchError(null);
    try {
      const list = await tourInstanceService.listItineraryFeedback(tourInstanceId, activeDayId);
      setItems(list);
    } catch (err) {
      const msg = handleApiError(err).message;
      setFeedbackFetchError(msg);
      toast.error(t("landing.privateCoDesign.commentsError"));
    } finally {
      setLoadingFeedback(false);
    }
  }, [activeDayId, tourInstanceId, t]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const submitCustomerComment = async () => {
    const text = comment.trim();
    if (!text || !activeDayId) return;
    setSending(true);
    try {
      await tourInstanceService.createItineraryFeedback(tourInstanceId, activeDayId, {
        bookingId,
        content: text,
        isFromCustomer: true,
      });
      setComment("");
      toast.success(t("landing.privateCoDesign.feedbackSent"));
      await loadFeedback();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setSending(false);
    }
  };

  if (!sortedDays.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        <MapTrifold className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
        <p className="text-sm font-medium">{t("landing.privateCoDesign.noDaysYet")}</p>
      </div>
    );
  }

  return (
    <section
      data-testid="private-co-design-customer-section"
      className="rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] md:p-8"
    >
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
            {t("landing.privateCoDesign.pageTitle")}
          </h2>
          <p className="text-sm text-slate-500">{t("landing.privateCoDesign.draftItinerary")}</p>
        </div>
        {finalSellPrice != null && finalSellPrice >= 0 ? (
          <div className="rounded-xl border border-[#fa8b02]/30 bg-orange-50/80 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t("landing.privateCoDesign.finalPriceLabel", "Final Price")}
            </p>
            <p className="text-base font-bold text-slate-900 mb-2" data-final-sell-price-display>
              {fmtVnd(finalSellPrice)}
            </p>
            <button
              type="button"
              disabled={paying}
              onClick={async () => {
                setPaying(true);
                try {
                  const tx = await paymentService.getPendingByBookingId(bookingId);
                  if (tx?.transactionCode) {
                    router.push(`/checkout/payment?transactionCode=${tx.transactionCode}`);
                  } else {
                    toast.error(t("landing.privateCoDesign.noPendingTransaction", "Không tìm thấy giao dịch thanh toán. Vui lòng đợi Operator cập nhật!"));
                  }
                } catch (err) {
                  toast.error(handleApiError(err).message);
                } finally {
                  setPaying(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#fa8b02] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#e07d02] disabled:opacity-50"
            >
              {paying ? (
                <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle weight="bold" className="size-3.5" />
              )}
              {t("landing.privateCoDesign.acceptAndPay", "Accept & Pay")}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {sortedDays.map((d) => (
          <button
            key={d.id}
            type="button"
            data-day-tab={d.id}
            onClick={() => setActiveDayId(d.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors md:text-sm ${
              activeDayId === d.id
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}>
            {t("landing.privateCoDesign.dayTab", { n: d.instanceDayNumber })}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:p-5">
        {sortedDays.find((d) => d.id === activeDayId) ? (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              {sortedDays.find((d) => d.id === activeDayId)?.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {sortedDays.find((d) => d.id === activeDayId)?.description ?? ""}
            </p>
          </div>
        ) : null}

        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <ChatCircleText className="size-5 text-[#fa8b02]" weight="fill" aria-hidden />
          <span className="text-sm font-bold">{t("landing.privateCoDesign.commentsForDay")}</span>
        </div>

        {loadingFeedback ? (
          <p className="text-sm text-slate-500" data-loading-feedback>
            {t("landing.privateCoDesign.loadingComments")}
          </p>
        ) : feedbackFetchError ? (
          <div data-feedback-error className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {t("landing.privateCoDesign.commentsError")}
          </div>
        ) : (
          <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((f) => (
              <li
                key={f.id}
                data-feedback-item={f.id}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  f.isFromCustomer
                    ? "border-slate-200 bg-white"
                    : "border-orange-100 bg-orange-50/60"
                }`}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {f.isFromCustomer
                      ? t("landing.privateCoDesign.fromYou", "Customer")
                      : t("landing.privateCoDesign.fromOperator", "Operator")}
                  </p>
                  {f.isFromCustomer && f.status && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        f.status === "Pending"
                          ? "bg-stone-100 text-stone-600"
                          : f.status === "ManagerApproved"
                            ? "bg-emerald-100 text-emerald-700"
                            : f.status === "ManagerForwarded"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t(`landing.privateCoDesign.status${f.status}`, f.status)}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-slate-800">{f.content}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {tourStatus && tourStatus !== "Draft" ? (
            <div className="rounded-xl bg-slate-100 p-3 text-center text-xs text-slate-500">
              {t("landing.privateCoDesign.lockedInput", "Tour đã chốt, bạn không thể gửi thêm phản hồi.")}
            </div>
          ) : (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("landing.privateCoDesign.yourCommentPlaceholder")}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#fa8b02] focus:outline-none focus:ring-2 focus:ring-[#fa8b02]/25"
              />
              <button
                type="button"
                data-action="send-customer-feedback"
                disabled={sending || !comment.trim()}
                onClick={() => void submitCustomerComment()}
                className="h-10 rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("landing.privateCoDesign.sendFeedback")}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
