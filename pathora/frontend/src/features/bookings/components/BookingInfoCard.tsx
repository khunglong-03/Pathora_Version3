"use client";
import React from "react";
import { FileText, Bank, CreditCard, IdentificationCard, CalendarBlank, Key } from "@phosphor-icons/react";
import { BookingDetail, TIER_CONFIG } from "./BookingDetailData";
import { motion } from "framer-motion";

interface BookingInfoCardProps {
  booking: BookingDetail;
  getTierLabel: (tier: BookingDetail["tier"]) => string;
  getPaymentMethodLabel: (m: BookingDetail["paymentMethod"]) => string;
}

export function BookingInfoCard({ booking, getTierLabel, getPaymentMethodLabel }: BookingInfoCardProps) {
  const tierCfg = TIER_CONFIG[booking.tier];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 overflow-hidden"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="relative flex items-center justify-center size-12 rounded-[1rem] bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-600">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <IdentificationCard weight="fill" className="size-6" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Booking Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bento Grid Cells for Information */}
        <div className="col-span-1 md:col-span-2 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Key weight="fill" className="size-4 text-slate-400" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Booking Reference</p>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tracking-tighter">
            {booking.reference}
          </p>
        </div>

        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-white/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
          <div className="flex items-center gap-2 relative z-10">
            <CalendarBlank weight="fill" className="size-4 text-slate-400" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Booking Date</p>
          </div>
          <p className="text-lg font-bold text-slate-900 tracking-tight relative z-10">{booking.bookingDate}</p>
        </div>

        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CalendarBlank weight="fill" className="size-4 text-slate-400" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Departure</p>
          </div>
          <p className="text-lg font-bold text-slate-900 tracking-tight">{booking.departureDate}</p>
        </div>

        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-between gap-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Classification</p>
          <span
            className={`inline-flex items-center justify-center w-fit px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-bold border border-current/10 ${tierCfg.bg} ${tierCfg.text}`}
          >
            {getTierLabel(booking.tier)}
          </span>
        </div>

        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col justify-between gap-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Payment Method</p>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              {booking.paymentMethod === "bank_transfer" ? (
                <Bank weight="fill" className="size-5 text-slate-600" />
              ) : (
                <CreditCard weight="fill" className="size-5 text-slate-600" />
              )}
            </div>
            <span className="text-base font-bold text-slate-900">
              {getPaymentMethodLabel(booking.paymentMethod)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
