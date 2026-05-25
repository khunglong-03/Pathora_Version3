"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

import { BookingVisaSection } from "./BookingVisaSection";
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
import { BookingCustomerApprovalAction } from "./BookingCustomerApprovalAction";
import { CancellationRequestTimeline } from "./CancellationRequestTimeline";
import { BookingRefundSection } from "./BookingRefundSection";
import { useBookingStatusListener } from "@/hooks/useBookingStatusListener";

import { NormalizedTourInstanceDto } from "@/types/tour";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { BookingDetailResponse } from "@/types/booking";
import type { BookingDetail } from "./BookingDetailData";

export function BookingDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const bookingId = params?.id as string;
  
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [tourInstance, setTourInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBookingWithoutLoading = useCallback(async () => {
    try {
      const data = await bookingService.getBookingDetail(bookingId);
      if (data) setBooking(data);
    } catch (e) {
      console.error(e);
    }
  }, [bookingId]);

  useBookingStatusListener(useCallback((event) => {
    const matchingIds = [bookingId, booking?.id, booking?.bookingId].filter(Boolean);
    if (matchingIds.includes(event.bookingId)) {
      void fetchBookingWithoutLoading();
    }
  }, [bookingId, booking?.id, booking?.bookingId, fetchBookingWithoutLoading]));

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
            if (data.tourInstanceId) {
              try {
                const instanceData = await tourInstanceService.getInstanceDetail(data.tourInstanceId);
                if (!cancelled && instanceData) {
                  setTourInstance(instanceData);
                }
              } catch (e) {
                console.error("Failed to fetch tour instance", e);
              }
            }
            return; // success — stop retrying
          }
          // API returned null/empty — backend may not have committed yet
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            if (cancelled) return;
            continue;
          }
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            continue;
          }
          // Do not set sample booking
        } finally {
          if (!cancelled) setLoading(false);
        }
        break;
      }
    };

    void fetchBooking();
    return () => { cancelled = true; };
  }, [bookingId]);

  useEffect(() => {
    if (loading || !booking) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#visa") return;
    const el = document.getElementById("visa");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, booking]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) return null;

  let mappedStatusStr = booking.status?.toLowerCase() || "pending";
  if (mappedStatusStr === "pendingapproval") mappedStatusStr = "pending_approval";
  if (mappedStatusStr === "pendingcancellation") mappedStatusStr = "pending_cancellation";

  const actualStatus = booking.tourStatus === "PendingCustomerApproval" 
    ? "pending_approval" 
    : mappedStatusStr;
  const resolvedBookingId = booking.id ?? booking.bookingId ?? bookingId;

  // Bridge BookingDetailResponse → BookingDetail for existing child components
  const mappedBooking: BookingDetail = {
    id: resolvedBookingId,
    tourName: booking.tourName ?? booking.description ?? "Unknown Tour",
    reference: booking.reference ?? `PATH-${resolvedBookingId.slice(0, 8)}`,
    tier: "standard",
    status: actualStatus as any,
    paymentStatus: (booking.paymentStatus as any) ?? "unpaid",
    paymentMethod: (booking.paymentMethod as any) ?? "bank_transfer",
    location: "",
    duration: "",
    bookingDate: "",
    departureDate: "",
    returnDate: "",
    adults: booking.adults ?? 0,
    children: booking.children ?? 0,
    infants: booking.infants ?? 0,
    pricePerPerson: booking.adultPrice ?? 0,
    adultPrice: booking.adultPrice,
    childPrice: booking.childPrice,
    infantPrice: booking.infantPrice,
    adultSubtotal: booking.adultSubtotal,
    childSubtotal: booking.childSubtotal,
    infantSubtotal: booking.infantSubtotal,
    subtotal: booking.subtotal,
    taxRate: booking.taxRate,
    taxAmount: booking.taxAmount,
    totalAmount: booking.totalAmount,
    paidAmount: booking.paidAmount,
    remainingBalance: booking.remainingBalance,
    image: "/assets/images/tours/placeholder.png",
    description: booking.description ?? "",
    highlights: booking.highlights ?? [],
    importantInfo: (booking.importantInfo as unknown as string[]) ?? [],
    pendingTransactionCode: booking.pendingTransactionCode,
    tourInstanceId: booking.tourInstanceId,
    isVisaRequired: booking.isVisaRequired,
    tourStatus: booking.tourStatus,
    bookingType: booking.bookingType,
    visaServiceFeeTotal: booking.visaServiceFeeTotal,
    cancellationRequest: booking.cancellationRequest,
    cancellationRequests: booking.cancellationRequests,
  };

  const { totalGuests, showPayRemaining, showVisaSection, showCancelBooking } =
    getBookingDerivedState(mappedBooking);

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
        <BookingHeroSection booking={mappedBooking} getStatusLabel={labelFns.getStatusLabel} />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 relative z-20 mb-20">
          <div className="v-stack lg:h-stack gap-6">
            {/* Left Column */}
            <div className="spacer v-stack gap-6 min-w-0">
              <BookingInfoCard
                booking={mappedBooking}
                getTierLabel={labelFns.getTierLabel}
                getPaymentMethodLabel={labelFns.getPaymentMethodLabel}
              />
              <GuestDetailsCard booking={mappedBooking} totalGuests={totalGuests} />
              {showVisaSection && (
                <div id="visa" className="scroll-mt-24">
                  <BookingVisaSection bookingId={mappedBooking.id} />
                </div>
              )}
              <BookingOverviewTab
                booking={mappedBooking}
                tourInstance={tourInstance}
                totalGuests={totalGuests}
                getTierLabel={labelFns.getTierLabel}
              />
              <BookingImportantInfo booking={mappedBooking} />
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[480px] shrink-0 v-stack gap-6 lg:sticky lg:top-8 self-start">
              {mappedBooking.status === "pending_approval" && (
                <BookingCustomerApprovalAction
                  bookingId={mappedBooking.id}
                  tourInstanceId={mappedBooking.tourInstanceId || mappedBooking.id}
                  onSuccess={fetchBookingWithoutLoading}
                />
              )}
              <BookingPaymentSummary
                booking={mappedBooking}
                totalGuests={totalGuests}
                showPayRemaining={showPayRemaining}
                showCancelBooking={showCancelBooking}
                getPaymentStatusLabel={labelFns.getPaymentStatusLabel}
                onCancellationChanged={fetchBookingWithoutLoading}
              />
              <CancellationRequestTimeline requests={mappedBooking.cancellationRequests || []} />
              <BookingRefundSection
                bookingId={mappedBooking.id}
                bookingStatus={mappedBooking.status}
                refundStatus={booking.refundStatus}
                refundOutstandingAmount={booking.refundOutstandingAmount}
                refundContactedAt={booking.refundContactedAt}
                refundCompletedAt={booking.refundCompletedAt}
                onChanged={fetchBookingWithoutLoading}
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
