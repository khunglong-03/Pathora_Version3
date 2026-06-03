import React, { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import { Icon } from "@/components/ui";
import { CSS } from "../BookingsPageData";
import { TableRow, StatusBadge } from "./BookingsShared";
import { rowVariants } from "../BookingsPageData";
import type { AdminBooking } from "@/api/services/adminService";
import { formatCurrency } from "@/utils/format";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import ParticipantReviewModal from "./ParticipantReviewModal";

interface BookingsTableProps {
  bookings: AdminBooking[];
  t: any;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRefresh?: () => void;
}

export function BookingsTable({
  bookings,
  t,
  totalCount,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onRefresh,
}: BookingsTableProps) {
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const isTourOperator = user?.roles?.some((r) => r.name === "TourOperator");

  const columns = [
    "bookings.column.booking",
    "bookings.column.customer",
    "bookings.column.tour",
    "bookings.column.departure",
    "bookings.column.pax",
    "bookings.column.amount",
    "bookings.column.status",
    "bookings.column.passengers",
  ];

  return (
    <div className="rounded-[2.5rem] bg-white/60 p-1.5 ring-1 ring-stone-950/[0.045] shadow-[0_36px_110px_-66px_rgba(68,64,60,0.7)]">
    <Card bodyClass="p-0 border-0 shadow-none overflow-hidden" className="rounded-[calc(2.5rem-0.375rem)] border-0 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]">
      <div className="flex flex-col gap-3 px-6 pb-4 pt-5 shadow-[inset_0_-1px_0_rgba(28,25,23,0.06)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: CSS.textMuted }}>
            {t("bookings.tableLabel")}
          </p>
          <p className="mt-1 text-sm font-medium text-stone-500">
            {totalCount} {t("bookings.stat.totalBookings")}
          </p>
        </div>
        <div className="inline-flex w-fit rounded-full bg-stone-100 p-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-950/[0.04]">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            {t("bookings.pagination.page")} {currentPage}/{totalPages}
          </span>
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="shadow-[inset_0_-1px_0_rgba(28,25,23,0.06)]">
              {columns.map((colKey) => (
                <th
                  key={colKey}
                  className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: CSS.textMuted }}
                >
                  {t(colKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, i) => (
              <TableRow
                key={booking.id}
                booking={booking}
                index={i}
                onReviewParticipants={(id) => setReviewBookingId(id)}
                t={t}
                isTourOperator={!!isTourOperator}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 bg-stone-50/50 p-3 lg:hidden">
        {bookings.map((booking, i) => (
          <motion.div
            key={booking.id}
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="show"
            className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_50px_-38px_rgba(68,64,60,0.75),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-stone-950/[0.045]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold tracking-[-0.02em]" style={{ color: CSS.textPrimary }}>
                  {booking.customerName ?? booking.customer ?? "—"}
                </p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: CSS.textMuted }}>
                  {String(booking.id).slice(0, 12)}...
                </p>
              </div>
              <StatusBadge status={booking.status ?? "pending"} />
            </div>
            <div className="grid gap-3 rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-950/[0.035]">
              <div>
                <p className="text-sm font-medium" style={{ color: CSS.textSecondary }}>
                  {booking.tourName ?? booking.tour ?? "—"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: CSS.textMuted }}>
                  {booking.departureDate ?? booking.departure ?? "—"}
                </p>
              </div>
              <p className="text-lg font-semibold tracking-[-0.03em] data-value tabular-nums" style={{ color: CSS.textPrimary }}>
                {formatCurrency(booking.amount ?? 0)}
              </p>
            </div>
            {/* Passengers row in mobile layout */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-500">{t("bookings.column.passengers", "Hành khách")}:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewBookingId(booking.id.toString())}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] hover:bg-stone-50 cursor-pointer ${
                    booking.hasRejectedParticipants
                      ? "bg-red-50 text-red-700 border-red-200"
                      : booking.approvedParticipants === booking.totalParticipants && booking.totalParticipants > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {booking.hasRejectedParticipants && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  )}
                  {booking.approvedParticipants ?? 0}/{booking.totalParticipants ?? 0} {t("participantReview.status.approvedCountSuffix", "duyệt")}
                </button>
                {isTourOperator && (
                  <button
                    type="button"
                    onClick={() => setReviewBookingId(booking.id.toString())}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    {t("participantReview.button", "Duyệt")}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col gap-3 bg-white px-6 py-4 shadow-[inset_0_1px_0_rgba(28,25,23,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm" style={{ color: CSS.textMuted }}>
          {t("bookings.pagination.page")} {currentPage}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={onPreviousPage}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-600 ring-1 ring-black/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {t("common.previous")}
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={onNextPage}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </Card>

    {reviewBookingId && (
      <ParticipantReviewModal
        bookingId={reviewBookingId}
        isOpen={!!reviewBookingId}
        onClose={() => setReviewBookingId(null)}
        onReviewed={() => {
          onRefresh?.();
        }}
      />
    )}
    </div>
  );
}
