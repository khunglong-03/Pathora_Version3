"use client";
import React from "react";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { BookingDetail, PAYMENT_STATUS_COLOR } from "./BookingDetailData";
import { formatCurrency, getPaymentStatusLabel } from "./BookingDetailHelpers";

interface BookingPaymentSummaryProps {
  booking: BookingDetail;
  totalGuests: number;
  showPayRemaining: boolean;
  showVisaStatus: boolean;
  showCancelBooking: boolean;
  getPaymentStatusLabel: (s: BookingDetail["paymentStatus"]) => string;
}

export function BookingPaymentSummary({
  booking,
  totalGuests,
  showPayRemaining,
  showVisaStatus,
  showCancelBooking,
  getPaymentStatusLabel,
}: BookingPaymentSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
      <h3 className="text-lg font-bold text-[#05073c] mb-4">
        Payment Summary
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Price per person</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(booking.pricePerPerson)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Number of guests</span>
          <span className="text-sm font-semibold text-gray-900">
            &times;{totalGuests}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-base font-bold text-gray-700">Total Amount</span>
          <span className="text-2xl font-bold text-[#fa8b02]">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Paid (Deposit)</span>
          <span className="text-sm font-semibold text-green-600">
            -{formatCurrency(booking.paidAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-base font-bold text-gray-700">
            Remaining Balance
          </span>
          <span className="text-xl font-bold text-[#f54900]">
            {formatCurrency(booking.remainingBalance)}
          </span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-orange-50 rounded-xl px-4 py-3 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">
            Payment Status
          </span>
          <span
            className={`text-sm font-bold ${PAYMENT_STATUS_COLOR[booking.paymentStatus]}`}
          >
            {getPaymentStatusLabel(booking.paymentStatus)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-4">
        {showPayRemaining && (
          <Button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00c950] text-white text-sm font-bold shadow-sm hover:bg-[#00b347] transition-colors"
          >
            <Icon icon="heroicons:currency-dollar" className="size-4" />
            Pay Remaining Balance
          </Button>
        )}

        {showVisaStatus && (
          <Button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Icon icon="heroicons:paper-airplane" className="size-4" />
            Visa Status
          </Button>
        )}

        {showCancelBooking && (
          <Button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-red-500 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
          >
            <Icon icon="heroicons:x-circle" className="size-4" />
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
}
