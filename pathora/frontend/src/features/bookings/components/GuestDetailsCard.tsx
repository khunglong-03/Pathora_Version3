"use client";
import React from "react";
import { Icon } from "@/components/ui";
import { BookingDetail } from "./BookingDetailData";

interface GuestDetailsCardProps {
  booking: BookingDetail;
  totalGuests: number;
}

export function GuestDetailsCard({ booking, totalGuests }: GuestDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="heroicons:users" className="size-5 text-[#05073c]" />
        <h2 className="text-xl font-bold text-[#05073c]">Guest Details</h2>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-700">Adults</p>
            <p className="text-xs text-gray-400">Age 13+</p>
          </div>
          <p className="text-lg font-bold text-[#05073c]">{booking.adults}</p>
        </div>
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Children</p>
            <p className="text-xs text-gray-400">Age 2-12</p>
          </div>
          <p className="text-lg font-bold text-[#05073c]">{booking.children}</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
          <p className="text-base font-bold text-gray-700">Total Guests</p>
          <p className="text-xl font-bold text-[#fa8b02]">{totalGuests}</p>
        </div>
      </div>
    </div>
  );
}
