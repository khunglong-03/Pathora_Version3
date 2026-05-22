import React from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import { Icon } from "@/components/ui";
import { CSS } from "../BookingsPageData";
import { TableRow, StatusBadge } from "./BookingsShared";
import { rowVariants } from "../BookingsPageData";
import type { AdminBooking } from "@/api/services/adminService";
import { formatCurrency } from "@/utils/format";

interface BookingsTableProps {
  bookings: AdminBooking[];
  t: (key: string) => string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function BookingsTable({
  bookings,
  t,
  totalCount,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: BookingsTableProps) {
  const columns = [
    "bookings.column.booking",
    "bookings.column.customer",
    "bookings.column.tour",
    "bookings.column.departure",
    "bookings.column.pax",
    "bookings.column.amount",
    "bookings.column.status",
  ];

  return (
    <Card bodyClass="p-0 border-0 shadow-none overflow-hidden" className="border-0 shadow-none">
      <div className="px-6 pt-5 pb-3" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: CSS.textMuted }}>
          {t("bookings.tableLabel")} &middot; {totalCount}
        </p>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
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
              <TableRow key={booking.id} booking={booking} index={i} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-stone-50">
        {bookings.map((booking, i) => (
          <motion.div
            key={booking.id}
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="show"
            className="p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: CSS.textPrimary }}>
                  {booking.customerName ?? booking.customer ?? "—"}
                </p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: CSS.textMuted }}>
                  {String(booking.id).slice(0, 12)}...
                </p>
              </div>
              <StatusBadge status={booking.status ?? "pending"} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: CSS.textSecondary }}>
                  {booking.tourName ?? booking.tour ?? "—"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: CSS.textMuted }}>
                  {booking.departureDate ?? booking.departure ?? "—"}
                </p>
              </div>
              <p className="text-base font-bold data-value" style={{ color: CSS.textPrimary }}>
                {formatCurrency(booking.amount ?? 0)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${CSS.borderSub}` }}>
        <p className="text-sm" style={{ color: CSS.textMuted }}>
          {t("bookings.pagination.page")} {currentPage}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={onPreviousPage}
            className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            style={{ borderColor: CSS.border, color: CSS.textSecondary, backgroundColor: CSS.surface }}
          >
            {t("common.previous")}
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={onNextPage}
            className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            style={{ borderColor: CSS.border, color: CSS.textSecondary, backgroundColor: CSS.surface }}
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </Card>
  );
}
