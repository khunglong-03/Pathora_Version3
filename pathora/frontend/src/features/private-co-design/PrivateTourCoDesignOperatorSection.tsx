"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ArrowsDownUp, CaretDown, CaretUp } from "@phosphor-icons/react";
import {
  tourInstanceService,
  type TourItineraryFeedbackDto,
} from "@/api/services/tourInstanceService";
import type { TourInstanceDayDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatCurrency } from "@/features/dashboard/components/tour-instance/ViewComponents";

export interface PrivateTourCoDesignOperatorSectionProps {
  tourInstanceId: string;
  /** Primary booking on this instance (settlement / context). */
  bookingId: string | null;
  days: TourInstanceDayDto[];
  initialFinalSellPrice?: number | null;
  onFinalPriceSaved?: () => void;
}

export function PrivateTourCoDesignOperatorSection({
  tourInstanceId,
  bookingId,
  days,
  initialFinalSellPrice,
  onFinalPriceSaved,
}: PrivateTourCoDesignOperatorSectionProps) {
  const { t } = useTranslation();
  const sourceDays = useMemo(
    () => [...(days ?? [])].sort((a, b) => a.instanceDayNumber - b.instanceDayNumber),
    [days],
  );

  const [orderedIds, setOrderedIds] = useState<string[]>(() => sourceDays.map((d) => d.id));
  useEffect(() => {
    setOrderedIds(sourceDays.map((d) => d.id));
  }, [sourceDays]);

  const orderedDays = useMemo(() => {
    const byId = new Map(sourceDays.map((d) => [d.id, d]));
    return orderedIds.map((id) => byId.get(id)).filter(Boolean) as TourInstanceDayDto[];
  }, [orderedIds, sourceDays]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(sourceDays[0]?.id ?? null);
  const [items, setItems] = useState<TourItineraryFeedbackDto[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [priceInput, setPriceInput] = useState(
    initialFinalSellPrice != null ? String(initialFinalSellPrice) : "",
  );
  const [savingPrice, setSavingPrice] = useState(false);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    if (initialFinalSellPrice != null) {
      setPriceInput(String(initialFinalSellPrice));
    }
  }, [initialFinalSellPrice]);

  const loadFeedback = useCallback(async () => {
    if (!activeDayId) return;
    setLoadingFeedback(true);
    try {
      const list = await tourInstanceService.listItineraryFeedback(tourInstanceId, activeDayId);
      setItems(list);
    } catch {
      toast.error(t("landing.privateCoDesign.commentsError"));
    } finally {
      setLoadingFeedback(false);
    }
  }, [activeDayId, tourInstanceId, t]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const moveIdx = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= orderedIds.length) return;
    setOrderedIds((prev) => {
      const copy = [...prev];
      const tmp = copy[idx]!;
      copy[idx] = copy[next]!;
      copy[next] = tmp;
      return copy;
    });
  };

  const onDropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrderedIds((prev) => {
      const without = prev.filter((id) => id !== dragId);
      const ti = without.indexOf(targetId);
      const copy = [...without];
      copy.splice(ti, 0, dragId);
      return copy;
    });
    setDragId(null);
  };

  const saveFinalPrice = async () => {
    const n = Number(priceInput.replace(/,/g, ""));
    if (Number.isNaN(n) || n < 0) {
      toast.error(t("landing.privateCoDesign.invalidPrice"));
      return;
    }
    setSavingPrice(true);
    try {
      await tourInstanceService.setFinalSellPrice(tourInstanceId, n);
      toast.success(t("landing.privateCoDesign.finalPriceSaved"));
      onFinalPriceSaved?.();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setSavingPrice(false);
    }
  };

  const applySettlement = async () => {
    if (!bookingId) {
      toast.warn(t("landing.privateCoDesign.noBookingForSettlement"));
      return;
    }
    setSettling(true);
    try {
      const result = await tourInstanceService.applyPrivateSettlement(tourInstanceId, bookingId);
      if (result && result.delta > 0 && result.topUpTransactionId) {
        toast.success(t("landing.privateCoDesign.settlementTopUpCreated"));
      } else if (result && result.creditAmount && result.creditAmount > 0) {
        toast.success(
          t("landing.privateCoDesign.settlementCredited", {
            amount: formatCurrency(Number(result.creditAmount)),
          }),
        );
      } else {
        toast.success(t("landing.privateCoDesign.settlementSuccess"));
      }
      onFinalPriceSaved?.();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setSettling(false);
    }
  };

  const sendOperatorReply = async () => {
    const text = replyText.trim();
    if (!text || !activeDayId) return;
    setSending(true);
    try {
      await tourInstanceService.createItineraryFeedback(tourInstanceId, activeDayId, {
        bookingId: null,
        content: text,
        isFromCustomer: false,
      });
      setReplyText("");
      toast.success(t("landing.privateCoDesign.feedbackSent"));
      await loadFeedback();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      data-testid="private-co-design-operator-section"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-stone-900">
          {t("landing.privateCoDesign.operatorTitle")}
        </h2>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          <ArrowsDownUp className="size-4" aria-hidden />
          <span className="hidden md:inline">{t("landing.privateCoDesign.reorderHintDesktop")}</span>
          <span className="md:hidden">{t("landing.privateCoDesign.reorderHintMobile")}</span>
        </span>
      </div>

      <div data-co-design-reorder className="mb-6 space-y-2">
        {orderedDays.map((d, idx) => (
          <div
            key={d.id}
            draggable
            data-day-reorder-card={d.id}
            onDragStart={() => setDragId(d.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropOn(d.id)}
            className="hidden cursor-grab items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 active:cursor-grabbing md:flex"
          >
            <span className="text-xs font-bold text-stone-500">{d.instanceDayNumber}</span>
            <span className="flex-1 truncate text-sm font-semibold text-stone-900">{d.title}</span>
          </div>
        ))}
        {orderedDays.map((d, idx) => (
          <div
            key={`m-${d.id}`}
            data-day-reorder-mobile={d.id}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 md:hidden"
          >
            <div className="flex flex-1 flex-col">
              <span className="text-xs font-bold text-stone-500">Day {d.instanceDayNumber}</span>
              <span className="truncate text-sm font-semibold text-stone-900">{d.title}</span>
            </div>
            <button
              type="button"
              aria-label={t("landing.privateCoDesign.moveUp")}
              className="rounded-lg border border-stone-200 bg-white p-1.5"
              onClick={() => moveIdx(idx, -1)}
            >
              <CaretUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t("landing.privateCoDesign.moveDown")}
              className="rounded-lg border border-stone-200 bg-white p-1.5"
              onClick={() => moveIdx(idx, 1)}
            >
              <CaretDown className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-4 md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
              {t("landing.privateCoDesign.finalSellPriceLabel")}
            </label>
            <button
              type="button"
              onClick={() => {
                const total = days.reduce((sum, day) => 
                  sum + day.activities.reduce((actSum, act) => actSum + (act.price || 0), 0), 0);
                setPriceInput(String(total));
              }}
              className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              {t("landing.privateCoDesign.fillTotalCost", "Gợi ý tổng chi phí")}
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            data-operator-final-price-input
          />
          <p className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span>{t("landing.privateCoDesign.finalSellPriceHint")}</span>
            <span className="font-medium text-stone-600">
              Tổng chi phí hiện tại: {formatCurrency(days.reduce((sum, day) => sum + day.activities.reduce((actSum, act) => actSum + (act.price || 0), 0), 0))}
            </span>
          </p>
          <button
            type="button"
            data-action="set-final-sell-price"
            disabled={savingPrice}
            onClick={() => void saveFinalPrice()}
            className="mt-2 h-9 rounded-xl bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {t("landing.privateCoDesign.saveFinalPrice")}
          </button>
        </div>
        <div className="flex flex-col justify-end">
          <button
            type="button"
            data-action="apply-private-settlement"
            disabled={settling || !bookingId}
            onClick={() => void applySettlement()}
            className="h-10 rounded-xl bg-[#fa8b02] text-sm font-bold text-white shadow-sm hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("landing.privateCoDesign.applySettlement")}
          </button>
          {!bookingId ? (
            <p className="mt-2 text-xs text-amber-800">{t("landing.privateCoDesign.noBookingForSettlement")}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {orderedDays.map((d) => (
          <button
            key={d.id}
            type="button"
            data-operator-day-tab={d.id}
            onClick={() => setActiveDayId(d.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              activeDayId === d.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            {d.instanceDayNumber}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-stone-100 bg-stone-50/40 p-4">
        {loadingFeedback ? (
          <p className="text-sm text-stone-500">{t("landing.privateCoDesign.loadingComments")}</p>
        ) : (
          <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
            {items.map((f) => (
              <li
                key={f.id}
                data-operator-feedback={f.id}
                className={`rounded-lg border px-2 py-1.5 text-sm ${
                  f.isFromCustomer ? "border-stone-200 bg-white" : "border-orange-100 bg-orange-50/50"
                }`}
              >
                {f.content}
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={t("landing.privateCoDesign.operatorReplyPlaceholder")}
          rows={2}
          className="mb-2 w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
        <button
          type="button"
          data-action="send-operator-reply"
          disabled={sending || !replyText.trim()}
          onClick={() => void sendOperatorReply()}
          className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {t("landing.privateCoDesign.sendReply")}
        </button>
      </div>
    </section>
  );
}
