"use client";
import React from "react";
import { Users, User, Baby } from "@phosphor-icons/react";
import { BookingDetail } from "./BookingDetailData";
import { motion } from "framer-motion";

interface GuestDetailsCardProps {
  booking: BookingDetail;
  totalGuests: number;
}

export function GuestDetailsCard({ booking, totalGuests }: GuestDetailsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8"
    >
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 border-dashed">
        <div className="flex items-center justify-center size-10 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
          <Users weight="fill" className="size-5 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Guest Details</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Adults */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <User weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Adults</p>
              <p className="text-xs font-medium text-slate-500">Age 13+</p>
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{booking.adults}</p>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <Baby weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Children</p>
              <p className="text-xs font-medium text-slate-500">Age 2-12</p>
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{booking.children}</p>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-6 mt-2 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Users weight="fill" className="size-5 text-white" />
            </div>
            <p className="text-base font-bold">Total Guests</p>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-400">{totalGuests}</p>
        </div>
      </div>
    </motion.div>
  );
}
