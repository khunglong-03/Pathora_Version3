"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle } from "@phosphor-icons/react";
import { BookingDetail, STATUS_CONFIG } from "./BookingDetailData";

interface BookingHeroSectionProps {
  booking: BookingDetail;
  getStatusLabel: (s: BookingDetail["status"]) => string;
}

export function BookingHeroSection({ booking, getStatusLabel }: BookingHeroSectionProps) {
  const statusCfg = STATUS_CONFIG[booking.status];
  
  let StatusIcon = CheckCircle;
  if (booking.status === "pending" || booking.status === "pending_approval") {
    StatusIcon = Clock;
  } else if (booking.status === "cancelled" || booking.status === "rejected") {
    StatusIcon = XCircle;
  }

  return (
    <section className="relative w-full pt-6 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto min-h-[500px]">
        {/* Left Side: Text & Actions */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 v-stack justify-between relative overflow-hidden">
          {/* Subtle animated background gradient */}
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_left,_#f0fdf4_0%,_transparent_50%)]"
          />

          <div className="relative z-10 v-stack items-start gap-12 h-full justify-between">
            <div>
              <Link
                href="/bookings"
                className="h-stack items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
              >
                <div className="center size-8 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                  <ArrowLeft weight="bold" className="size-4" />
                </div>
                Back to Bookings
              </Link>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
              className="w-full"
            >
              <div className="h-stack items-center gap-3 mb-6">
                <span
                  className={`h-stack items-center gap-1.5 px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-bold ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <StatusIcon weight="fill" className="size-4" />
                  </motion.div>
                  {getStatusLabel(booking.status)}
                </span>
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400 font-mono">
                  REF: {booking.reference}
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl tracking-tighter leading-[1.1] font-bold text-slate-900 mb-8">
                {booking.tourName}
              </h1>

              <div className="h-stack flex-wrap items-center gap-4 text-slate-700 text-sm md:text-base font-bold">
                <div className="h-stack items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[1.5rem]">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <MapPin weight="fill" className="size-5 text-emerald-500" />
                  </motion.div>
                  {booking.location}
                </div>
                <div className="h-stack items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[1.5rem]">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock weight="fill" className="size-5 text-amber-500" />
                  </motion.div>
                  {booking.duration}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Image Bento */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative h-[400px] lg:h-full rounded-[2.5rem] overflow-hidden border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] group"
        >
          <motion.div
            className="absolute inset-0 w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <Image
              src={booking.image}
              alt={booking.tourName}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
      </div>
    </section>
  );
}
