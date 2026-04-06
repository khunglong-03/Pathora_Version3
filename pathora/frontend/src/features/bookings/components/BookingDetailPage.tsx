"use client";
import React from "react";
import { useParams } from "next/navigation";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { SAMPLE_BOOKINGS } from "./BookingDetailData";
import {
  getStatusLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getTierLabel,
  getBookingDerivedState,
} from "./BookingDetailHelpers";
import { BookingHeroSection } from "./BookingHeroSection";
import { BookingInfoCard } from "./BookingInfoCard";
import { GuestDetailsCard } from "./GuestDetailsCard";
import { BookingOverviewTab } from "./BookingOverviewTab";
import { BookingImportantInfo } from "./BookingImportantInfo";
import { BookingPaymentSummary } from "./BookingPaymentSummary";
import { BookingNeedHelp } from "./BookingNeedHelp";
import { BookingFloatingSocial } from "./BookingFloatingSocial";

/* ══════════════════════════════════════════════════════════════
   ██  BookingDetailPage
   ══════════════════════════════════════════════════════════════ */
export function BookingDetailPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const booking = SAMPLE_BOOKINGS[bookingId] ?? SAMPLE_BOOKINGS["1"];

  const { totalGuests, showPayRemaining, showVisaStatus, showCancelBooking } =
    getBookingDerivedState(booking);

  const labelFns = {
    getStatusLabel: (s: Parameters<typeof getStatusLabel>[1]) =>
      getStatusLabel((key) => key, s),
    getPaymentStatusLabel: (s: Parameters<typeof getPaymentStatusLabel>[1]) =>
      getPaymentStatusLabel((key) => key, s),
    getPaymentMethodLabel: (m: Parameters<typeof getPaymentMethodLabel>[1]) =>
      getPaymentMethodLabel((key) => key, m),
    getTierLabel: (t: Parameters<typeof getTierLabel>[1]) =>
      getTierLabel((key) => key, t),
  };

  return (
    <>
      <LandingHeader />

      <main className="bg-gray-50 min-h-screen">
        <BookingHeroSection booking={booking} getStatusLabel={labelFns.getStatusLabel} />

        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-8">
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
            <div className="w-full lg:w-[390px] shrink-0 flex flex-col gap-6">
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

      <LandingFooter />
      <BookingFloatingSocial />
    </>
  );
}
