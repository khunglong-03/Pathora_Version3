"use client";
import React from "react";
import { Phone, EnvelopeSimple, Lifebuoy } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function BookingNeedHelp() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      className="rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group bg-slate-900 border border-slate-800"
    >
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 size-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
      />
      
      <div className="relative z-10">
        <div className="h-stack items-center gap-4 mb-4">
          <div className="center size-12 rounded-[1rem] bg-white/10 text-white backdrop-blur-md border border-white/20">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lifebuoy weight="fill" className="size-6 text-blue-400" />
            </motion.div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">Need Help?</h3>
        </div>
        <p className="text-base font-medium text-slate-400 mb-8 max-w-[250px]">
          Contact our support team for any questions about your booking.
        </p>

        <div className="v-stack gap-4">
          {/* Phone */}
          <motion.a
            whileHover={{ scale: 1.02, x: 5 }}
            href="tel:+1234567890"
            className="h-stack items-center gap-4 bg-white/5 rounded-[1.5rem] p-5 hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-sm"
          >
            <div className="center size-12 rounded-[1rem] bg-white/10 text-white shrink-0 border border-white/10">
              <Phone weight="fill" className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Phone Support</p>
              <p className="text-lg font-bold text-white tracking-tight">
                +1 (234) 567-890
              </p>
            </div>
          </motion.a>
          
          {/* Email */}
          <motion.a
            whileHover={{ scale: 1.02, x: 5 }}
            href="mailto:support@pathora.com"
            className="h-stack items-center gap-4 bg-white/5 rounded-[1.5rem] p-5 hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-sm"
          >
            <div className="center size-12 rounded-[1rem] bg-white/10 text-white shrink-0 border border-white/10">
              <EnvelopeSimple weight="fill" className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Email Support</p>
              <p className="text-lg font-bold text-white tracking-tight">
                support@pathora.com
              </p>
            </div>
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
