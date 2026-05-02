import React from "react";
import { Icon } from "@/components/ui";
import { STATUS_BADGE, CSS, type BookingStatus } from "../BookingsPageData";

/* ── Status Badge ─────────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status as BookingStatus];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
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
      className="group cursor-default"
      style={{ borderBottom: `1px solid ${CSS.borderSub}` }}
    >
      <td className="px-6 py-4">
        <span className="font-mono text-xs tracking-tight" style={{ color: CSS.textMuted }}>
          {String(booking.id).slice(0, 12)}...
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium" style={{ color: CSS.textPrimary }}>
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
        <span className="text-sm font-semibold data-value" style={{ color: CSS.textPrimary }}>
          {formatCurrency(booking.amount ?? 0)}
        </span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={booking.status ?? "pending"} />
      </td>
    </motion.tr>
  );
});
