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
}: {
  booking: AdminBooking;
  index: number;
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
    </motion.tr>
  );
});
