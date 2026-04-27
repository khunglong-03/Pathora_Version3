"use client";
import React from "react";
import { Phone, EnvelopeSimple, Lifebuoy } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function BookingNeedHelp() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-[2.5rem] p-8 shadow-xl shadow-[#05073c]/10 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-[#05073c] z-0" />
      <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl z-0" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-2xl bg-white/10 text-white shadow-sm backdrop-blur-sm">
            <Lifebuoy weight="fill" className="size-5" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">Need Help?</h3>
        </div>
        <p className="text-sm font-medium text-white/70 mb-8 pl-1">
          Contact our support team for any questions about your booking.
        </p>

        <div className="flex flex-col gap-3">
          {/* Phone */}
          <a
            href="tel:+1234567890"
            className="group/item flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-4 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white shrink-0 group-hover/item:scale-110 transition-transform">
              <Phone weight="fill" className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-0.5">Phone</p>
              <p className="text-sm font-bold text-white">
                +1 (234) 567-890
              </p>
            </div>
          </a>
          
          {/* Email */}
          <a
            href="mailto:support@pathora.com"
            className="group/item flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-4 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white shrink-0 group-hover/item:scale-110 transition-transform">
              <EnvelopeSimple weight="fill" className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-0.5">Email</p>
              <p className="text-sm font-bold text-white">
                support@pathora.com
              </p>
            </div>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
