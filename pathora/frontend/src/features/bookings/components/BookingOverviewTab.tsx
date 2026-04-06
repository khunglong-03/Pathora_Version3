"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { BookingDetail } from "./BookingDetailData";
import { QuickInfoItem } from "./BookingDetailSubComponents";
import { formatCurrency, getTierLabel } from "./BookingDetailHelpers";

interface BookingOverviewTabProps {
  booking: BookingDetail;
  totalGuests: number;
  getTierLabel: (tier: BookingDetail["tier"]) => string;
}

export function BookingOverviewTab({ booking, totalGuests, getTierLabel }: BookingOverviewTabProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary">("overview");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-gray-100">
        <Button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-[#fa8b02] border-b-2 border-[#fa8b02] bg-orange-50/50"
              : "text-gray-400 border-b-2 border-transparent hover:text-gray-600"
          }`}
        >
          <Icon icon="heroicons:information-circle" className="size-4" />
          Overview
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTab("itinerary")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
            activeTab === "itinerary"
              ? "text-[#fa8b02] border-b-2 border-[#fa8b02] bg-orange-50/50"
              : "text-gray-400 border-b-2 border-transparent hover:text-gray-600"
          }`}
        >
          <Icon icon="heroicons:document-text" className="size-4" />
          Itinerary
        </Button>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "overview" ? (
          <div className="flex flex-col gap-6">
            {/* Quick info strip */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickInfoItem
                  icon="heroicons:clock"
                  label="Duration"
                  value={booking.duration}
                />
                <QuickInfoItem
                  icon="heroicons:tag"
                  label="Package"
                  value={getTierLabel(booking.tier)}
                />
                <QuickInfoItem
                  icon="heroicons:map-pin"
                  label="Location"
                  value={booking.location}
                />
                <QuickInfoItem
                  icon="heroicons:users"
                  label="Guests"
                  value={`${totalGuests} pax`}
                />
              </div>
            </div>

            {/* About This Tour */}
            <div>
              <h3 className="text-base font-bold text-[#05073c] mb-3">
                About This Tour
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {booking.description}
              </p>
            </div>

            {/* Tour Highlights */}
            <div>
              <h3 className="text-base font-bold text-[#05073c] mb-3">
                Tour Highlights
              </h3>
              <div className="flex flex-col gap-2">
                {booking.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2">
                    <Icon
                      icon="heroicons:check-circle"
                      className="size-4 text-green-500 mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-gray-600">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon
              icon="heroicons:document-text"
              className="size-12 text-gray-200 mx-auto mb-3"
            />
            <p className="text-sm text-gray-400">Itinerary coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
