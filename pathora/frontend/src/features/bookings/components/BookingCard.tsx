"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  CalendarBlank, 
  Users, 
  CurrencyCircleDollar, 
  UserPlus, 
  AirplaneTilt, 
  DownloadSimple, 
  ArrowRight,
  Receipt
} from "@phosphor-icons/react";
import { Booking } from "./BookingHistoryData";
import { StatusOverlay, TierBadge } from "./BookingHistorySubComponents";

interface BookingCardProps {
  booking: Booking;
  statusLabel: string;
  tierLabel: string;
  paymentStatusLabel: string;
  paymentMethodLabel: string;
  formatCurrency: (n: number) => string;
  t: (key: string) => string;
}

export function BookingCard({
  booking,
  statusLabel,
  tierLabel,
  paymentStatusLabel,
  paymentMethodLabel,
  formatCurrency,
  t,
}: BookingCardProps) {
  const showPayRemaining = booking.paymentStatus === "partial";
  const showAddParticipants = booking.status === "pending";
  const showVisaStatus =
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden group"
    >
      <div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-6 lg:gap-8">
        {/* Image Box */}
        <div className="relative w-full lg:w-72 h-56 lg:h-auto shrink-0 rounded-[1.5rem] overflow-hidden">
          <Image
            src={booking.image}
            alt={booking.tourName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 288px"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent" />
          <div className="absolute top-4 left-4 z-10">
            <StatusOverlay status={booking.status} label={statusLabel} />
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col justify-between py-2">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                  {booking.tourName}
                </h3>
                <TierBadge tier={booking.tier} label={tierLabel} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Receipt weight="bold" className="size-4 text-slate-400" />
                <span className="text-sm text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                  {booking.reference}
                </span>
              </div>
            </div>
            
            {/* Payment Status */}
            <div className="sm:text-right shrink-0 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {paymentStatusLabel}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{paymentMethodLabel}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <InfoItem icon={<MapPin weight="bold" />} label={t("landing.bookings.location")} value={booking.location} />
            <InfoItem icon={<Clock weight="bold" />} label={t("landing.bookings.duration")} value={booking.duration} />
            <InfoItem icon={<CalendarBlank weight="bold" />} label={t("landing.bookings.departure")} value={booking.departure} />
            <InfoItem 
              icon={<Users weight="bold" />} 
              label={t("landing.bookings.guests")} 
              value={`${booking.guests} ${booking.guests === 1 ? t("landing.bookings.guest") : t("landing.bookings.guestsLabel")}`} 
            />
          </div>

          {/* Footer actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 border-t border-slate-100 border-dashed">
            
            {/* Price */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                {t("landing.bookings.totalAmount")}
              </p>
              <p className="text-3xl font-bold tracking-tighter text-slate-900">
                {formatCurrency(booking.totalAmount)}
              </p>
              {booking.remainingAmount && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-orange-500"></span>
                  </span>
                  <p className="text-xs font-bold text-orange-600">
                    {t("landing.bookings.remaining")}: {formatCurrency(booking.remainingAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {(showPayRemaining || showAddParticipants || showVisaStatus) && (
                <div className="flex items-center gap-2 mr-2">
                  {showPayRemaining && (
                    <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                      <CurrencyCircleDollar weight="bold" className="size-4" />
                      {t("landing.bookings.payRemaining")}
                    </button>
                  )}
                  {showAddParticipants && (
                    <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                      <UserPlus weight="bold" className="size-4" />
                      {t("landing.bookings.addParticipants")}
                    </button>
                  )}
                  {showVisaStatus && (
                    <Link href="/visa" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                      <AirplaneTilt weight="bold" className="size-4" />
                      {t("landing.bookings.visaStatus")}
                    </Link>
                  )}
                </div>
              )}

              <button type="button" className="inline-flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors" title={t("landing.bookings.invoice")}>
                <DownloadSimple weight="bold" className="size-4" />
              </button>
              
              <Link href={`/bookings/${booking.id}`} className="inline-flex items-center justify-center size-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-md shadow-slate-900/20" title={t("landing.bookings.viewDetails")}>
                <ArrowRight weight="bold" className="size-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center size-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-700 leading-tight">{value}</p>
      </div>
    </div>
  );
}
