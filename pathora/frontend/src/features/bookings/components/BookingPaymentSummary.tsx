"use client";
import React from "react";
import Link from "next/link";
import { CurrencyCircleDollar, AirplaneTilt, XCircle, Receipt } from "@phosphor-icons/react";
import { BookingDetail, PAYMENT_STATUS_COLOR } from "./BookingDetailData";
import { formatCurrency, getPaymentStatusLabel } from "./BookingDetailHelpers";
import { motion, AnimatePresence } from "framer-motion";

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
      transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 sticky top-8 flex flex-col relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex items-center justify-center size-12 rounded-[1rem] bg-slate-900 border border-slate-800 shadow-sm text-white overflow-hidden">
          <motion.div 
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"
          />
          <Receipt weight="fill" className="size-6 relative z-10" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          Summary
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {/* Infinite Carousel Data Stream effect for the price breakdown */}
        <div className="flex flex-col gap-3 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-slate-500">Price per person</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {formatCurrency(booking.pricePerPerson)}
            </span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-slate-500">Number of guests</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              &times;{totalGuests}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 px-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">Total Amount</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-bold text-slate-500">Paid Amount</span>
          <span className="text-sm font-bold font-mono text-emerald-500">
            -{formatCurrency(booking.paidAmount)}
          </span>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex flex-col p-6 mt-4 bg-slate-900 rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-xl shadow-slate-900/10"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl"
          />
          <span className="text-sm font-bold text-slate-400 mb-1 relative z-10">
            Remaining Balance
          </span>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-3xl font-bold font-mono text-white tracking-tighter">
              {formatCurrency(booking.remainingBalance)}
            </span>
            <span
              className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-white/10 text-white backdrop-blur-sm border border-white/10`}
            >
              {getPaymentStatusLabel(booking.paymentStatus)}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <AnimatePresence>
          {showPayRemaining && (
            <motion.div key="btn-pay" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/payment/${booking.pendingTransactionId}`}
                className="group relative flex items-center justify-center gap-2 w-full py-5 rounded-[1.5rem] bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <CurrencyCircleDollar weight="bold" className="size-5 relative z-10" />
                <span className="relative z-10">Pay Remaining Balance</span>
              </Link>
            </motion.div>
          )}

          {showVisaStatus && (
            <motion.button
              key="btn-visa"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 w-full py-5 rounded-[1.5rem] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <AirplaneTilt weight="bold" className="size-5 text-blue-500" />
              </motion.div>
              Visa Status
            </motion.button>
          )}

          {showCancelBooking && (
            <motion.div key="btn-cancel" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/bookings/${booking.id}/cancellation`}
                className="flex items-center justify-center gap-2 w-full py-5 rounded-[1.5rem] border border-red-100 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100/50 transition-colors mt-2"
              >
                <XCircle weight="bold" className="size-5" />
                Cancel Booking
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
