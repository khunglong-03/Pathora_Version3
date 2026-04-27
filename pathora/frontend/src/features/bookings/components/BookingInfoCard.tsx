"use client";
import React from "react";
import { FileText, Bank, CreditCard } from "@phosphor-icons/react";
import { BookingDetail, TIER_CONFIG } from "./BookingDetailData";
import { InfoField } from "./BookingDetailSubComponents";
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
      transition={{ delay: 0.3 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8"
    >
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 border-dashed">
        <div className="flex items-center justify-center size-10 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
          <FileText weight="fill" className="size-5 text-slate-700" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Booking Information
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
        <InfoField
          label="Booking Reference"
          value={booking.reference}
          mono
        />
        <InfoField label="Booking Date" value={booking.bookingDate} />
        <InfoField label="Departure Date" value={booking.departureDate} />
        <InfoField label="Return Date" value={booking.returnDate} />
        
        <div className="flex flex-col">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Classification</p>
          <span
            className={`inline-flex items-center justify-center w-fit px-3 py-1 rounded-[0.5rem] text-[10px] uppercase tracking-widest font-bold border border-current/10 ${tierCfg.bg} ${tierCfg.text}`}
          >
            {getTierLabel(booking.tier)}
          </span>
        </div>

        <div className="flex flex-col">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Payment Method</p>
          <div className="flex items-center gap-2 mt-0.5">
            {booking.paymentMethod === "bank_transfer" ? (
              <Bank weight="fill" className="size-4 text-slate-400" />
            ) : (
              <CreditCard weight="fill" className="size-4 text-slate-400" />
            )}
            <span className="text-sm font-bold text-slate-900">
              {getPaymentMethodLabel(booking.paymentMethod)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
