import React from "react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, ClockCounterClockwise } from "@phosphor-icons/react";
import { BookingCancellationRequestSummaryDto } from "@/types/booking";

interface CancellationRequestTimelineProps {
  requests: BookingCancellationRequestSummaryDto[];
}

export function CancellationRequestTimeline({ requests }: CancellationRequestTimelineProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? vi : enUS;

  if (!requests || requests.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-6">
        {t("landing.bookings.cancellationRequests", "Cancellation Requests History")}
      </h3>
      <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
        {requests.map((req, index) => {
          const isPending = req.status.toLowerCase() === "pending";
          const isApproved = req.status.toLowerCase() === "approved";
          const isRejected = req.status.toLowerCase() === "rejected";

          return (
            <div key={req.requestId} className="relative">
              {/* Icon Status */}
              <div
                className={`absolute -left-[41px] top-0 size-8 rounded-full flex items-center justify-center border-4 border-white ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-600"
                    : isRejected
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {isApproved && <CheckCircle weight="fill" />}
                {isRejected && <XCircle weight="fill" />}
                {isPending && <ClockCounterClockwise weight="fill" />}
              </div>

              {/* Content */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  {isApproved
                    ? t("landing.bookings.requestApproved", "Request Approved")
                    : isRejected
                    ? t("landing.bookings.requestRejected", "Request Rejected")
                    : t("landing.bookings.requestPending", "Request Pending")}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  {format(new Date(req.createdAt), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                </p>

                {isRejected && req.managerNote && (
                  <div className="mt-2 text-sm text-slate-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="font-semibold text-red-800">
                      {t("landing.bookings.managerNote", "Reason")}:
                    </span>{" "}
                    {req.managerNote}
                  </div>
                )}
                
                {isApproved && (
                  <div className="mt-2 text-sm text-slate-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-emerald-800">
                      {t("landing.bookings.refundAmount", "Refund Amount")}:
                    </span>{" "}
                    <span className="font-mono">{req.refundAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
