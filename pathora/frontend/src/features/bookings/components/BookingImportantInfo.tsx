"use client";
import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { BookingDetail } from "./BookingDetailData";
import { motion } from "framer-motion";

interface BookingImportantInfoProps {
  booking: BookingDetail;
}

export function BookingImportantInfo({ booking }: BookingImportantInfoProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-10 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <WarningCircle weight="fill" className="size-32 text-blue-500" />
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-[1rem] bg-blue-100 text-blue-600 shrink-0">
            <WarningCircle weight="bold" className="size-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-blue-900">
            Important Information
          </h3>
        </div>
        
        <ul className="flex flex-col gap-4">
          {booking.importantInfo.map((info, idx) => (
            <motion.li 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="flex items-start gap-4 bg-white/50 border border-blue-100/50 p-4 rounded-2xl backdrop-blur-sm"
            >
              <div className="mt-1 flex items-center justify-center size-5 rounded-full bg-blue-200 text-blue-700 shrink-0 text-xs font-bold font-mono">
                {idx + 1}
              </div>
              <span className="text-base font-bold text-blue-900 leading-relaxed">
                {info}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
