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
      transition={{ delay: 0.6 }}
      className="bg-blue-50/50 border border-blue-100/50 rounded-[2.5rem] p-8 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-blue-100/50 text-blue-600 shrink-0">
          <WarningCircle weight="fill" className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-blue-900 mb-3">
            Important Information
          </h3>
          <ul className="flex flex-col gap-2">
            {booking.importantInfo.map((info) => (
              <li key={info} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1 size-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm font-medium text-blue-800 leading-relaxed">
                  {info}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
