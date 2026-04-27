"use client";
import React from "react";
import { CurrencyCircleDollar, AirplaneTilt, XCircle, Receipt } from "@phosphor-icons/react";
import { BookingDetail, PAYMENT_STATUS_COLOR } from "./BookingDetailData";
import { formatCurrency, getPaymentStatusLabel } from "./BookingDetailHelpers";
import { motion } from "framer-motion";

interface BookingPaymentSummaryProps {
  booking: BookingDetail;
  totalGuests: number;
  showPayRemaining: boolean;
  showVisaStatus: boolean;
  showCancelBooking: boolean;
  getPaymentStatusLabel: (s: BookingDetail["paymentStatus"]) => string;
}

export function BookingPaymentSummary({
  booking,
  totalGuests,
  showPayRemaining,
  showVisaStatus,
  showCancelBooking,
  getPaymentStatusLabel,
}: BookingPaymentSummaryProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 sticky top-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center size-10 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm text-orange-500">
          <Receipt weight="fill" className="size-5" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          Payment Summary
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-sm font-medium text-slate-500">Price per person</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {formatCurrency(booking.pricePerPerson)}
          </span>
        </div>

        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium text-slate-500">Number of guests</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            &times;{totalGuests}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 border-dashed px-4">
          <span className="text-base font-bold text-slate-900">Total Amount</span>
          <span className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium text-slate-500">Paid Amount</span>
          <span className="text-sm font-bold font-mono text-emerald-600">
            -{formatCurrency(booking.paidAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 mt-2 bg-orange-50 rounded-2xl border border-orange-100/50">
          <span className="text-base font-bold text-slate-900">
            Remaining Balance
          </span>
          <span className="text-xl font-bold font-mono text-orange-600">
            {formatCurrency(booking.remainingBalance)}
          </span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between py-5 border-y border-slate-100 border-dashed mt-6">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
          Status
        </span>
        <span
          className={`text-sm uppercase font-bold tracking-wider px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg ${PAYMENT_STATUS_COLOR[booking.paymentStatus]}`}
        >
          {getPaymentStatusLabel(booking.paymentStatus)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        {showPayRemaining && (
          <button
            type="button"
            className="group relative flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <CurrencyCircleDollar weight="bold" className="size-5 relative z-10" />
            <span className="relative z-10">Pay Remaining Balance</span>
          </button>
        )}

        {showVisaStatus && (
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-blue-50/50 border border-blue-200 text-blue-600 text-sm font-bold hover:bg-blue-100/50 transition-colors"
          >
            <AirplaneTilt weight="bold" className="size-5" />
            Visa Status
          </button>
        )}

        {showCancelBooking && (
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-red-200 bg-red-50/30 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors mt-2"
          >
            <XCircle weight="bold" className="size-5" />
            Cancel Booking
          </button>
        )}
      </div>
    </motion.div>
  );
}
