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
  AirplaneTilt,
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
  t: (key: string, options?: Record<string, unknown>) => string;
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
  const showPayRemaining =
    (booking.paymentStatus === "partial" || booking.paymentStatus === "unpaid") &&
    (booking.remainingAmount ?? 0) > 0 &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected" &&
    booking.status !== "pending_cancellation";
  const showVisaStatus =
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -4,
        boxShadow: "0 30px 60px -15px rgba(28,25,23,0.08)"
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "group overflow-hidden rounded-[2rem] border border-stone-200/50 bg-white p-5 shadow-[0_15px_30px_-10px_rgba(28,25,23,0.03)] transition-all duration-300"
      )}
    >
      <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-stretch")}>
        
        {/* Asymmetric Image Box with physical hover scaling and glass overlay */}
        <div className={cn("relative h-[240px] lg:h-[280px] w-full shrink-0 overflow-hidden rounded-[1.5rem] lg:w-[240px] self-start")}>
          <Image
            src={booking.image}
            alt={booking.tourName}
            fill
            className={cn("object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105")}
            style={{ objectFit: "cover" }}
            sizes="(max-width: 1024px) 100vw, 240px"
          />
          <div className={cn("absolute inset-0 bg-linear-to-b from-black/15 via-transparent to-black/30")} />
          
          {/* Status Overlay floating gracefully with high contrast */}
          <div className={cn("absolute left-4 top-4 z-10")}>
            <StatusOverlay status={booking.status} label={statusLabel} />
          </div>
        </div>

        {/* Content Box with strict alignment and typography hierarchy */}
        <div className={cn("flex flex-col justify-between flex-1 py-1")}>
          
          {/* Header Row */}
          <div className={cn("flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-start")}>
            <div className={cn("space-y-2.5 min-w-0")}>
              <div className={cn("flex flex-wrap items-center gap-3")}>
                <h3 className={cn("text-xl font-extrabold tracking-tight text-stone-900 leading-tight font-sans")}>
                  {booking.tourName}
                </h3>
                <TierBadge tier={booking.tier} label={tierLabel} />
              </div>
              <div className={cn("flex items-center gap-2 text-stone-400")}>
                <Receipt weight="bold" className={cn("size-4 text-stone-300")} />
                <span className={cn("rounded-md bg-stone-100/80 px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-500 tracking-wider")}>
                  {booking.reference}
                </span>
              </div>
            </div>
            
            {/* Elegant Payment Status Frame */}
            <div className={cn("shrink-0 rounded-2xl border border-stone-200/50 bg-stone-50/50 px-4 py-3 sm:text-right shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]")}>
              <p className={cn("text-[10px] font-extrabold uppercase tracking-widest text-[#C9873A]")}>
                {paymentStatusLabel}
              </p>
              <p className={cn("mt-0.5 text-xs font-bold text-stone-500 font-sans")}>
                {paymentMethodLabel}
              </p>
            </div>
          </div>

          {/* Details Info Grid with spacious margins */}
          <div className={cn("mb-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-stone-100/70 pt-5")}>
            <InfoItem icon={<MapPin weight="bold" />} label={t("landing.bookings.location")} value={booking.location} />
            <InfoItem icon={<Clock weight="bold" />} label={t("landing.bookings.duration")} value={booking.duration} />
            <InfoItem icon={<CalendarBlank weight="bold" />} label={t("landing.bookings.departure")} value={booking.departure} />
            <InfoItem 
              icon={<Users weight="bold" />} 
              label={t("landing.bookings.guests")} 
              value={`${booking.guests} ${booking.guests === 1 ? t("landing.bookings.guest") : t("landing.bookings.guestsLabel")}`} 
            />
            
            {/* Pax breakdown detailed display */}
            {((booking.adults ?? 0) > 0 || (booking.children ?? 0) > 0 || (booking.infants ?? 0) > 0) && (
              <div className="col-span-2 mt-1">
                <p className="text-[10px] font-bold text-stone-400 font-sans tracking-wide">
                  {t("landing.bookings.paxBreakdown", {
                    adults: booking.adults ?? 0,
                    children: booking.children ?? 0,
                    infants: booking.infants ?? 0,
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions & Price Details */}
          <div className={cn("flex flex-col justify-between gap-6 border-t border-dashed border-stone-100 pt-5 sm:flex-row sm:items-end")}>
            
            {/* Total Price display in custom Monospace */}
            <div className="space-y-1">
              <p className={cn("text-[9px] font-extrabold uppercase tracking-widest text-stone-400")}>
                {t("landing.bookings.totalAmount")}
              </p>
              <p className={cn("text-2xl font-black text-stone-900 font-mono tracking-tight")}>
                {formatCurrency(booking.totalAmount)}
              </p>
              {booking.remainingAmount && (
                <div className={cn("flex items-center gap-2 mt-1.5 rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-1")}>
                  <span className={cn("relative flex size-2")}>
                    <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75")}></span>
                    <span className={cn("relative inline-flex size-2 rounded-full bg-[#C9873A]")}></span>
                  </span>
                  <p className={cn("text-[10px] font-extrabold text-amber-800 font-sans tracking-wider uppercase")}>
                    {t("landing.bookings.remaining")}: {formatCurrency(booking.remainingAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Micro-physics tactile buttons with premium springs */}
            <div className={cn("flex flex-wrap items-center gap-2.5")}>
              {(showPayRemaining || showVisaStatus || booking.status === "pending_approval") && (
                <div className={cn("flex flex-wrap items-center gap-2.5")}>
                  {booking.tourStatus === "PendingCustomerApproval" && (
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link 
                        href={`/bookings/${booking.id}`} 
                        className={cn(
                          "flex items-center gap-2 rounded-xl bg-[#C9873A] px-4 py-2.5 text-xs font-bold text-white transition-all shadow-[0_4px_12px_rgba(201,135,58,0.18)] hover:bg-[#b0732e] hover:shadow-[0_6px_16px_rgba(201,135,58,0.25)]"
                        )}
                      >
                        <CalendarBlank weight="bold" className={cn("size-4")} />
                        Duyệt lịch trình
                      </Link>
                    </motion.div>
                  )}
                  {showPayRemaining && (
                    <Link href={`/bookings/${booking.id}#pay`} className={cn("h-stack items-center gap-2 rounded-md bg-[#111111] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#333333] active:scale-95")}>
                      <CurrencyCircleDollar weight="bold" className={cn("size-4")} />
                      {t("landing.bookings.payRemaining")}
                    </Link>
                  )}
                  {showVisaStatus && (
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link 
                        href={`/bookings/${booking.id}`} 
                        className={cn(
                          "flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-xs font-bold text-stone-700 transition-all hover:bg-stone-100/80 hover:text-stone-900"
                        )}
                      >
                        <AirplaneTilt weight="bold" className={cn("size-4")} />
                        {t("landing.bookings.visaStatus")}
                      </Link>
                    </motion.div>
                  )}
                </div>
              )}
              
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link 
                  href={`/bookings/${booking.id}`} 
                  className={cn(
                    "flex items-center justify-center size-10 rounded-xl bg-stone-950 text-white transition-all hover:bg-stone-850 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  )} 
                  title={t("landing.bookings.viewDetails")}
                >
                  <ArrowRight weight="bold" className={cn("size-4.5")} />
                </Link>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3")}>
      <div className={cn("text-stone-300 pt-0.5 transition-colors duration-300 group-hover:text-[#C9873A]")}>
        {icon}
      </div>
      <div>
        <p className={cn("mb-0.5 text-[9px] font-extrabold uppercase tracking-widest text-stone-400 font-sans")}>{label}</p>
        <p className={cn("text-xs font-bold leading-snug text-stone-700")}>{value}</p>
      </div>
    </div>
  );
}
