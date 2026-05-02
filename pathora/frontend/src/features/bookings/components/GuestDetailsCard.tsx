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
      transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 overflow-hidden relative"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="relative flex items-center justify-center size-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 shadow-sm text-emerald-600 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-emerald-100/50 rounded-full blur-md"
          />
          <Users weight="fill" className="size-6 relative z-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Guest Details</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Adults */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 transition-colors hover:bg-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-[1rem] bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
              <User weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Adults</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Age 13+</p>
            </div>
          </div>
          <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{booking.adults}</p>
        </motion.div>

        {/* Children */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 transition-colors hover:bg-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-[1rem] bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
              <Baby weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Children</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Age 2-12</p>
            </div>
          </div>
          <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{booking.children}</p>
        </motion.div>

        {/* Total */}
        <div className="flex items-center justify-between p-8 mt-4 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
          {/* Subtle moving mesh background */}
          <motion.div 
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#10b981_0%,_transparent_60%)] opacity-20 pointer-events-none"
          />
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-[1rem] bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
              <Users weight="fill" className="size-6 text-emerald-400" />
            </div>
            <p className="text-lg font-bold">Total Guests</p>
          </div>
          <p className="text-5xl font-bold font-mono text-white tracking-tighter relative z-10">
            {totalGuests}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
