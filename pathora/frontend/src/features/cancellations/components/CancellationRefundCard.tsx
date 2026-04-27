import React from "react";
import { formatCurrency } from "@/features/bookings/components/BookingHistoryHelpers";
import { RefundBreakdown } from "./CancellationData";
import { Receipt, WarningCircle } from "@phosphor-icons/react";

export function CancellationRefundCard({ breakdown, status }: { breakdown: RefundBreakdown; status: string }) {
  const isRejected = status === "rejected";

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-900">
          <Receipt weight="bold" className="size-5" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900">Refund Breakdown</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-slate-100 border-dashed">
          <span className="text-sm font-bold text-slate-500">Total Paid</span>
          <span className="text-base font-bold text-slate-900">{formatCurrency(breakdown.totalPaid)}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b border-slate-100 border-dashed">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Cancellation Penalty</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
              {breakdown.penaltyPercentage}%
            </span>
          </div>
          <span className="text-base font-bold text-orange-600">
            -{formatCurrency(breakdown.penaltyAmount)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-4 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Final Refund</p>
            <p className={`text-4xl font-bold tracking-tighter ${isRejected ? 'text-slate-400' : 'text-emerald-500'}`}>
              {formatCurrency(breakdown.refundAmount)}
            </p>
          </div>
          {isRejected && (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
              <WarningCircle weight="bold" className="size-4" />
              Refund not applicable
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
