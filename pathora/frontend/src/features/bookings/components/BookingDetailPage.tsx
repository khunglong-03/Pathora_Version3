"use client";
import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

import { SAMPLE_BOOKINGS } from "./BookingDetailData";
import {
  getStatusLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getTierLabel,
  getBookingDerivedState,
} from "./BookingDetailHelpers";
import { useTranslation } from "react-i18next";
import { BookingHeroSection } from "./BookingHeroSection";
import { BookingInfoCard } from "./BookingInfoCard";
import { GuestDetailsCard } from "./GuestDetailsCard";
import { BookingOverviewTab } from "./BookingOverviewTab";
import { BookingImportantInfo } from "./BookingImportantInfo";
import { BookingPaymentSummary } from "./BookingPaymentSummary";
import { BookingNeedHelp } from "./BookingNeedHelp";
import { BookingFloatingSocial } from "./BookingFloatingSocial";

export function BookingDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const bookingId = params?.id as string;
  const booking = SAMPLE_BOOKINGS[bookingId] ?? SAMPLE_BOOKINGS["1"];

  const { totalGuests, showPayRemaining, showVisaStatus, showCancelBooking } =
    getBookingDerivedState(booking);

  const labelFns = {
    getStatusLabel: (s: Parameters<typeof getStatusLabel>[1]) =>
      getStatusLabel(t, s),
    getPaymentStatusLabel: (s: Parameters<typeof getPaymentStatusLabel>[1]) =>
      getPaymentStatusLabel(t, s),
    getPaymentMethodLabel: (m: Parameters<typeof getPaymentMethodLabel>[1]) =>
      getPaymentMethodLabel(t, m),
    getTierLabel: (tier: Parameters<typeof getTierLabel>[1]) =>
      getTierLabel(t, tier),
  };

  return (
    <>
      <main className="bg-[#f9fafb] min-h-[100dvh]">
        <BookingHeroSection booking={booking} getStatusLabel={labelFns.getStatusLabel} />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 relative z-20 mb-20">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <BookingInfoCard
                booking={booking}
                getTierLabel={labelFns.getTierLabel}
                getPaymentMethodLabel={labelFns.getPaymentMethodLabel}
              />
              <GuestDetailsCard booking={booking} totalGuests={totalGuests} />
              <BookingOverviewTab
                booking={booking}
                totalGuests={totalGuests}
                getTierLabel={labelFns.getTierLabel}
              />
              <BookingImportantInfo booking={booking} />
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-6">
              <BookingPaymentSummary
                booking={booking}
                totalGuests={totalGuests}
                showPayRemaining={showPayRemaining}
                showVisaStatus={showVisaStatus}
                showCancelBooking={showCancelBooking}
                getPaymentStatusLabel={labelFns.getPaymentStatusLabel}
              />
              <BookingNeedHelp />
            </div>
          </div>
        </div>
      </main>

      <BookingFloatingSocial />
    </>
  );
}
