"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ChatCircleText, MapTrifold, PaperPlaneRight, Check, X } from "@phosphor-icons/react";
import {
  tourInstanceService,
  type TourItineraryFeedbackDto,
} from "@/api/services/tourInstanceService";
import type { TourInstanceDayDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { useSignalR } from "@/hooks/useSignalR";

export interface PrivateTourCoDesignManagerSectionProps {
  tourInstanceId: string;
  days: TourInstanceDayDto[];
}

export function PrivateTourCoDesignManagerSection({
  tourInstanceId,
  days,
}: PrivateTourCoDesignManagerSectionProps) {
  const { t } = useTranslation();
  const { events } = useSignalR({ autoConnect: true });
  const sortedDays = useMemo(
    () => [...(days ?? [])].sort((a, b) => a.instanceDayNumber - b.instanceDayNumber),
    [days],
  );
  const [activeDayId, setActiveDayId] = useState<string | null>(sortedDays[0]?.id ?? null);
  const [items, setItems] = useState<TourItineraryFeedbackDto[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFetchError, setFeedbackFetchError] = useState<string | null>(null);

  // Reject reason state mapped by feedback id
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      console.log("Calling listItineraryFeedback with:", tourInstanceId, activeDayId);
      const list = await tourInstanceService.listItineraryFeedback(tourInstanceId, activeDayId);
      console.log("Got list:", list);
      setItems(list);
    } catch (err) {
      console.log("Error in loadFeedback:", err);
      const msg = handleApiError(err).message;
      setFeedbackFetchError(msg);
      toast.error(t("manager.coDesign.loadError", "Failed to load feedback queue."));
    } finally {
      setLoadingFeedback(false);
      console.log("Done loadFeedback");
    }
  }, [activeDayId, tourInstanceId, t]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    const unsub = events.onItineraryFeedbackEvent((update) => {
      // Only process updates for this specific tour instance
      if (update.tourInstanceId === tourInstanceId && update.event === "Pending") {
        toast.info(t("manager.coDesign.newFeedback", "Có yêu cầu Co-Design mới từ khách hàng!"));
        // Refresh feedback list
        void loadFeedback();
      }
    });
    return () => unsub();
  }, [events, tourInstanceId, loadFeedback, t]);

  const handleForward = async (feedback: TourItineraryFeedbackDto) => {
    setProcessingId(feedback.id);
    try {
      await tourInstanceService.forwardItineraryFeedbackToOperator(
        tourInstanceId,
        feedback.tourInstanceDayId,
        feedback.id,
        feedback.rowVersion
      );
      toast.success(t("manager.coDesign.forwardSuccess", "Forwarded to Operator successfully."));
      await loadFeedback();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (feedback: TourItineraryFeedbackDto) => {
    setProcessingId(feedback.id);
    try {
      await tourInstanceService.managerApproveItineraryFeedback(
        tourInstanceId,
        feedback.tourInstanceDayId,
        feedback.id,
        feedback.rowVersion
      );
      toast.success(t("manager.coDesign.approveSuccess", "Approved and sent to Customer."));
      await loadFeedback();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (feedback: TourItineraryFeedbackDto) => {
    setProcessingId(feedback.id);
    const reason = rejectReasons[feedback.id] || "";
    try {
      await tourInstanceService.managerRejectItineraryFeedback(
        tourInstanceId,
        feedback.tourInstanceDayId,
        feedback.id,
        reason,
        feedback.rowVersion
      );
      toast.success(t("manager.coDesign.rejectSuccess", "Rejected and sent back to Operator."));
      setRejectReasons((prev) => ({ ...prev, [feedback.id]: "" }));
      await loadFeedback();
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!sortedDays.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        <MapTrifold className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
        <p className="text-sm font-medium">{t("manager.coDesign.noDaysYet", "No days assigned to this tour.")}</p>
      </div>
    );
  }

  return (
    <section
      data-testid="private-co-design-manager-section"
      className="rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
          {t("manager.coDesign.pageTitle", "Co-Design Queue")}
        </h2>
        <p className="text-sm text-slate-500">
          {t("manager.coDesign.pageSubtitle", "Review customer feedback and operator responses.")}
        </p>
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
          <ChatCircleText className="size-5 text-indigo-600" weight="fill" aria-hidden />
          <span className="text-sm font-bold">{t("manager.coDesign.feedbackItems", "Feedback Items")}</span>
        </div>

        {loadingFeedback ? (
          <p className="text-sm text-slate-500" data-loading-feedback>
            {t("manager.coDesign.loading", "Loading queue...")}
          </p>
        ) : feedbackFetchError ? (
          <div data-feedback-error className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {feedbackFetchError}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">{t("manager.coDesign.noFeedback", "No feedback recorded for this day.")}</p>
        ) : (
          <ul className="max-h-96 space-y-4 overflow-y-auto pr-1">
            {items.map((f) => (
              <li
                key={f.id}
                data-feedback-item={f.id}
                className={`rounded-xl border p-4 text-sm ${
                  f.status === "Pending" ? "border-amber-200 bg-amber-50/50"
                  : f.status === "OperatorResponded" ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-200 bg-white"
                }`}>
                
                <div className="mb-2 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    f.status === "Pending" ? "bg-amber-100 text-amber-700" :
                    f.status === "ManagerForwarded" ? "bg-purple-100 text-purple-700" :
                    f.status === "OperatorResponded" ? "bg-blue-100 text-blue-700" :
                    f.status === "ManagerApproved" ? "bg-emerald-100 text-emerald-700" :
                    f.status === "ManagerRejected" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {t(`landing.privateCoDesign.status${f.status}`, f.status)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(f.createdOnUtc).toLocaleString()}
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-slate-800 mb-2">{f.content}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  {f.isFromCustomer
                    ? t("landing.privateCoDesign.fromCustomer", "From Customer")
                    : t("landing.privateCoDesign.fromOperator", "From Operator")}
                </p>

                {/* Manager Actions */}
                {f.status === "Pending" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={processingId === f.id}
                      onClick={() => handleForward(f)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <PaperPlaneRight weight="bold" />
                      {t("manager.coDesign.forward", "Forward to Operator")}
                    </button>
                  </div>
                )}

                {f.status === "OperatorResponded" && (
                  <div className="flex flex-col gap-2 border-t border-blue-100 pt-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={processingId === f.id}
                        onClick={() => handleApprove(f)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check weight="bold" className="size-4" />
                        {t("manager.coDesign.approve", "Approve")}
                      </button>
                    </div>
                    
                    <div className="mt-2 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder={t("manager.coDesign.rejectReasonPlaceholder", "Reason for rejection (optional)")}
                        value={rejectReasons[f.id] || ""}
                        onChange={(e) => setRejectReasons({ ...rejectReasons, [f.id]: e.target.value })}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        disabled={processingId === f.id}
                        onClick={() => handleReject(f)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                      >
                        <X weight="bold" className="size-3.5" />
                        {t("manager.coDesign.reject", "Reject")}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
