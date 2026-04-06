"use client";
import React from "react";
import { Icon } from "@/components/ui";
import { BookingDetail, TIER_CONFIG } from "./BookingDetailData";
import { InfoField } from "./BookingDetailSubComponents";
import { getTierLabel, getPaymentMethodLabel } from "./BookingDetailHelpers";

interface BookingInfoCardProps {
  booking: BookingDetail;
  getTierLabel: (tier: BookingDetail["tier"]) => string;
  getPaymentMethodLabel: (m: BookingDetail["paymentMethod"]) => string;
}

export function BookingInfoCard({ booking, getTierLabel, getPaymentMethodLabel }: BookingInfoCardProps) {
  const tierCfg = TIER_CONFIG[booking.tier];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="heroicons:document-text" className="size-5 text-[#05073c]" />
        <h2 className="text-xl font-bold text-[#05073c]">
          Booking Information
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InfoField
          label="Booking Reference"
          value={booking.reference}
          mono
        />
        <InfoField label="Booking Date" value={booking.bookingDate} />
        <InfoField label="Departure Date" value={booking.departureDate} />
        <InfoField label="Return Date" value={booking.returnDate} />
        <div>
          <p className="text-xs text-gray-400 mb-1">Classification</p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${tierCfg.bg} ${tierCfg.text}`}
          >
            {getTierLabel(booking.tier)}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Payment Method</p>
          <div className="flex items-center gap-2">
            <Icon
              icon={
                booking.paymentMethod === "bank_transfer"
                  ? "heroicons:building-library"
                  : "heroicons:credit-card"
              }
              className="size-4 text-gray-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              {getPaymentMethodLabel(booking.paymentMethod)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
