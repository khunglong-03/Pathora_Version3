"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui";
import { BookingDetail, STATUS_CONFIG } from "./BookingDetailData";
import { getStatusLabel } from "./BookingDetailHelpers";

interface BookingHeroSectionProps {
  booking: BookingDetail;
  getStatusLabel: (s: BookingDetail["status"]) => string;
}

export function BookingHeroSection({ booking, getStatusLabel }: BookingHeroSectionProps) {
  const statusCfg = STATUS_CONFIG[booking.status];
  return (
    <section className="relative h-[400px] sm:h-[448px]">
      <Image
        src={booking.image}
        alt={booking.tourName}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />

      <div className="absolute inset-0 flex flex-col justify-between">
        {/* Back link */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-20 sm:pt-24">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <Icon icon="heroicons:arrow-left" className="size-4" />
            Back to Bookings
          </Link>
        </div>

        {/* Tour info */}
        <div className="max-w-[80rem] mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold mb-4 ${statusCfg.bg} ${statusCfg.text}`}
          >
            <Icon icon={statusCfg.icon} className="size-4" />
            {getStatusLabel(booking.status)}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            {booking.tourName}
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:map-pin" className="size-4" />
              {booking.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:clock" className="size-4" />
              {booking.duration}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
