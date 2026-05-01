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
import { cn } from "@/lib/cn";

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
      className={cn("group overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]")}
    >
      <div className={cn("v-stack gap-6 p-4 lg:p-6")}>
        {/* Image Box */}
        <div className={cn("relative h-56 w-full shrink-0 overflow-hidden rounded-[1.5rem] sm:h-64")}>
          <Image
            src={booking.image}
            alt={booking.tourName}
            fill
            className={cn("object-cover transition-transform duration-700 group-hover:scale-105")}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className={cn("absolute inset-0 bg-linear-to-b from-black/20 to-transparent")} />
          <div className={cn("absolute left-4 top-4 z-10")}>
            <StatusOverlay status={booking.status} label={statusLabel} />
          </div>
        </div>

        {/* Content Box */}
        <div className={cn("v-stack spacer justify-between py-2")}>
          
          {/* Header row */}
          <div className={cn("v-stack mb-6 justify-between gap-4 sm:h-stack sm:items-start")}>
            <div className={cn("min-w-0")}>
              <div className={cn("h-stack flex-wrap items-center gap-3")}>
                <h3 className={cn("text-2xl font-bold leading-tight tracking-tight text-slate-900")}>
                  {booking.tourName}
                </h3>
                <TierBadge tier={booking.tier} label={tierLabel} />
              </div>
              <div className={cn("h-stack mt-2 items-center gap-2")}>
                <Receipt weight="bold" className={cn("size-4 text-slate-400")} />
                <span className={cn("rounded-md bg-slate-100 px-2 py-0.5 font-mono text-sm font-medium text-slate-500")}>
                  {booking.reference}
                </span>
              </div>
            </div>
            
            {/* Payment Status */}
            <div className={cn("shrink-0 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:text-right")}>
              <p className={cn("text-sm font-bold uppercase tracking-wide text-slate-900")}>
                {paymentStatusLabel}
              </p>
              <p className={cn("mt-0.5 text-xs font-medium text-slate-500")}>{paymentMethodLabel}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className={cn("mb-8 grid grid-cols-2 gap-x-4 gap-y-6")}>
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
          <div className={cn("v-stack justify-between gap-6 border-t border-dashed border-slate-100 pt-6 md:h-stack md:items-end")}>
            
            {/* Price */}
            <div>
              <p className={cn("mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400")}>
                {t("landing.bookings.totalAmount")}
              </p>
              <p className={cn("text-3xl font-bold tracking-tighter text-slate-900")}>
                {formatCurrency(booking.totalAmount)}
              </p>
              {booking.remainingAmount && (
                <div className={cn("h-stack mt-2 inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1")}>
                  <span className={cn("relative flex size-2")}>
                    <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75")}></span>
                    <span className={cn("relative inline-flex size-2 rounded-full bg-orange-500")}></span>
                  </span>
                  <p className={cn("text-xs font-bold text-orange-600")}>
                    {t("landing.bookings.remaining")}: {formatCurrency(booking.remainingAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={cn("h-stack flex-wrap items-center gap-3")}>
              {(showPayRemaining || showAddParticipants || showVisaStatus) && (
                <div className={cn("h-stack mr-2 items-center gap-2")}>
                  {showPayRemaining && (
                    <button type="button" className={cn("h-stack items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800")}>
                      <CurrencyCircleDollar weight="bold" className={cn("size-4")} />
                      {t("landing.bookings.payRemaining")}
                    </button>
                  )}
                  {showAddParticipants && (
                    <Link href={`/bookings/${booking.id}/participants`} className={cn("h-stack items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50")}>
                      <UserPlus weight="bold" className={cn("size-4")} />
                      {t("landing.bookings.addParticipants")}
                    </Link>
                  )}
                  {showVisaStatus && (
                    <Link href="/visa" className={cn("h-stack items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50")}>
                      <AirplaneTilt weight="bold" className={cn("size-4")} />
                      {t("landing.bookings.visaStatus")}
                    </Link>
                  )}
                </div>
              )}

              <button type="button" className={cn("center size-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900")} title={t("landing.bookings.invoice")}>
                <DownloadSimple weight="bold" className={cn("size-4")} />
              </button>
              
              <Link href={`/bookings/${booking.id}`} className={cn("center size-10 rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/20 transition-all hover:scale-105 hover:bg-slate-800 active:scale-95")} title={t("landing.bookings.viewDetails")}>
                <ArrowRight weight="bold" className={cn("size-4")} />
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
    <div className={cn("h-stack items-start gap-3")}>
      <div className={cn("center size-8 shrink-0 rounded-lg border border-slate-100 bg-slate-50 text-slate-400")}>
        {icon}
      </div>
      <div>
        <p className={cn("mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400")}>{label}</p>
        <p className={cn("text-sm font-bold leading-tight text-slate-700")}>{value}</p>
      </div>
    </div>
  );
}
