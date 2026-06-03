import React from "react";
import { Icon } from "@/components/ui";
import { STATUS_BADGE, CSS, type BookingStatus } from "../BookingsPageData";

/* ── Status Badge ─────────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status as BookingStatus;
  const badge = STATUS_BADGE[normalizedStatus] ?? STATUS_BADGE.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)]"
      style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
      {status}
    </span>
  );
}

/* ── Table Row ─────────────────────────────────────────────────── */
import { motion } from "framer-motion";
import type { AdminBooking } from "@/api/services/adminService";
import { formatCurrency } from "@/utils/format";
import { rowVariants } from "../BookingsPageData";

export const TableRow = React.memo(function TableRow({
  booking,
  index,
  onReviewParticipants,
  t,
  isTourOperator,
}: {
  booking: AdminBooking;
  index: number;
  onReviewParticipants: (bookingId: string) => void;
  t: any;
  isTourOperator: boolean;
}) {
  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="show"
      className="group cursor-default shadow-[inset_0_-1px_0_rgba(28,25,23,0.045)] transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-50/40"
    >
      <td className="px-6 py-4">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-xs tracking-tight ring-1 ring-stone-950/[0.035]" style={{ color: CSS.textMuted }}>
          {String(booking.id).slice(0, 12)}...
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-semibold tracking-[-0.015em]" style={{ color: CSS.textPrimary }}>
          {booking.customerName ?? booking.customer ?? "—"}
        </p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm" style={{ color: CSS.textSecondary }}>
          {booking.tourName ?? booking.tour ?? "—"}
        </p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm" style={{ color: CSS.textMuted }}>
          {booking.departureDate ?? booking.departure ?? "—"}
        </p>
      </td>
      <td className="px-6 py-4">
        <span className="rounded-full bg-stone-50 px-2.5 py-1 font-mono text-sm tabular-nums ring-1 ring-stone-950/[0.035]" style={{ color: CSS.textSecondary }} title="Adults / Children / Infants">
          {booking.numberAdult ?? 0}/{booking.numberChild ?? 0}/{booking.numberInfant ?? 0}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-semibold tracking-[-0.02em] data-value tabular-nums" style={{ color: CSS.textPrimary }}>
          {formatCurrency(booking.totalAmount ?? booking.amount ?? 0)}
        </span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={booking.status ?? "pending"} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onReviewParticipants(booking.id.toString())}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] hover:bg-stone-50 cursor-pointer ${
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
              onClick={() => onReviewParticipants(booking.id.toString())}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
            >
              {t("participantReview.button", "Duyệt")}
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
});
