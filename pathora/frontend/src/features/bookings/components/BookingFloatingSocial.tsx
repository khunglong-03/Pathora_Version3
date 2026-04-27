"use client";
import React from "react";
import { FacebookLogo, ChatTeardropDots } from "@phosphor-icons/react";
import { SOCIAL_MEDIA } from "@/configs/urls";
import { motion } from "framer-motion";

export function BookingFloatingSocial() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 }}
      className="fixed right-6 bottom-6 z-50 hidden md:flex flex-col gap-4"
    >
      <a
        href={SOCIAL_MEDIA.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        className="size-14 rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <FacebookLogo weight="fill" className="size-6 text-blue-600" />
      </a>
      <button
        type="button"
        aria-label="Chat with us"
        className="size-14 rounded-full bg-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] border border-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <ChatTeardropDots weight="fill" className="size-6 text-white" />
      </button>
    </motion.div>
  );
}
