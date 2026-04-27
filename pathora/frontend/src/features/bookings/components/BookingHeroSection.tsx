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
    <section className="relative h-[450px] lg:h-[550px] overflow-hidden">
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={booking.image}
          alt={booking.tourName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#05073c]/90 via-[#05073c]/40 to-black/20" />
      </motion.div>

      <div className="absolute inset-0 flex flex-col justify-between max-w-[1400px] mx-auto w-full px-4 md:px-8">
        {/* Back link */}
        <div className="pt-20 sm:pt-24 z-10">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors group"
          >
            <div className="flex items-center justify-center size-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors backdrop-blur-md">
              <ArrowLeft weight="bold" className="size-4" />
            </div>
            Back to Bookings
          </Link>
        </div>

        {/* Tour info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
          className="pb-10 lg:pb-16 z-10 max-w-4xl"
        >
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[1rem] text-[11px] uppercase tracking-wider font-bold mb-6 backdrop-blur-md ${statusCfg.bg} ${statusCfg.text}`}
          >
            <StatusIcon weight="fill" className="size-4" />
            {getStatusLabel(booking.status)}
          </span>
          <h1 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold text-white mb-6 drop-shadow-lg">
            {booking.tourName}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm md:text-base font-medium">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              <MapPin weight="fill" className="size-5 text-emerald-400" />
              {booking.location}
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              <Clock weight="fill" className="size-5 text-amber-400" />
              {booking.duration}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
