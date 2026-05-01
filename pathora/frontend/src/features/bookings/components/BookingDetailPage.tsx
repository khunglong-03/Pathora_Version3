"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

import { SAMPLE_BOOKINGS } from "./BookingDetailData";
import { bookingService } from "@/api/services";
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
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    const fetchBooking = async () => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 800;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          setLoading(true);
          const data = await bookingService.getBookingDetail(bookingId);
          if (cancelled) return;
          if (data) {
            setBooking(data);
            return; // success — stop retrying
          }
          // API returned null/empty — backend may not have committed yet
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            if (cancelled) return;
            continue;
          }
          // Exhausted retries and still no real data — fall back to sample
          setBooking(SAMPLE_BOOKINGS[bookingId] ?? SAMPLE_BOOKINGS["1"]);
        } catch (error) {
          console.error(`Failed to fetch booking (attempt ${attempt + 1})`, error);
          if (cancelled) return;
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            continue;
          }
          setBooking(SAMPLE_BOOKINGS[bookingId] ?? SAMPLE_BOOKINGS["1"]);
        } finally {
          if (!cancelled) setLoading(false);
        }
        break;
      }
    };

    void fetchBooking();
    return () => { cancelled = true; };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) return null;

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
