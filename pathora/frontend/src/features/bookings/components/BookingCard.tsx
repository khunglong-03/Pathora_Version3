"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { Booking } from "./BookingHistoryData";
import { StatusOverlay, TierBadge, InfoItem } from "./BookingHistorySubComponents";

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0">
          <Image
            src={booking.image}
            alt={booking.tourName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 256px"
          />
          <div className="absolute top-3 left-3">
            <StatusOverlay status={booking.status} label={statusLabel} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          {/* Header: Title + Tier + Payment badge */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">
                  {booking.tourName}
                </h3>
                <TierBadge tier={booking.tier} label={tierLabel} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon
                  icon="heroicons:document-text"
                  className="size-3.5 text-gray-400"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {booking.reference}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-slate-700">
                {paymentStatusLabel}
              </p>
              <p className="text-[11px] text-gray-400">{paymentMethodLabel}</p>
            </div>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <InfoItem
              icon="heroicons:map-pin"
              label={t("landing.bookings.location")}
              value={booking.location}
            />
            <InfoItem
              icon="heroicons:clock"
              label={t("landing.bookings.duration")}
              value={booking.duration}
            />
            <InfoItem
              icon="heroicons:calendar"
              label={t("landing.bookings.departure")}
              value={booking.departure}
            />
            <InfoItem
              icon="heroicons:users"
              label={t("landing.bookings.guests")}
              value={`${booking.guests} ${
                booking.guests === 1
                  ? t("landing.bookings.guest")
                  : t("landing.bookings.guestsLabel")
              }`}
            />
          </div>

          {/* Action buttons */}
          {(showPayRemaining || showAddParticipants || showVisaStatus) && (
            <div className="flex items-center gap-2 flex-wrap mt-4">
              {showPayRemaining && (
                <Button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-linear-to-r from-[#fa8b02] to-[#eb662b] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Icon icon="heroicons:currency-dollar" className="size-4" />
                  {t("landing.bookings.payRemaining")}
                </Button>
              )}
              {showAddParticipants && (
                <Button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-slate-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="heroicons:users" className="size-4" />
                  {t("landing.bookings.addParticipants")}
                </Button>
              )}
              {showVisaStatus && (
                <Link
                  href="/visa"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-slate-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="heroicons:paper-airplane" className="size-4" />
                  {t("landing.bookings.visaStatus")}
                </Link>
              )}
            </div>
          )}

          {/* Footer: Total + Actions */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">
                {t("landing.bookings.totalAmount")}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(booking.totalAmount)}
              </p>
              {booking.remainingAmount && (
                <p className="text-xs text-orange-500 font-medium">
                  {t("landing.bookings.remaining")}:{" "}
                  {formatCurrency(booking.remainingAmount)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <Icon icon="heroicons:arrow-down-tray" className="size-3.5" />
                {t("landing.bookings.invoice")}
              </Button>
              <Link
                href={`/bookings/${booking.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#05073c] text-white text-xs font-semibold hover:bg-[#05073c]/90 transition-colors"
              >
                <Icon icon="heroicons:eye" className="size-3.5" />
                {t("landing.bookings.viewDetails")}
                <Icon icon="heroicons:chevron-right" className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
