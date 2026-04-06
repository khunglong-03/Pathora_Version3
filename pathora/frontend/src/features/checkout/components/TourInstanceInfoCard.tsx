"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { fmtCurrency } from "./checkoutHelpers";

interface TourInstanceInfoCardProps {
  tourInstanceBooking: {
    tourInstanceId: string;
    tourName: string;
    startDate: string;
    endDate: string;
    location: string;
    depositPerPerson: number;
    bookingType: string;
    instanceType: string;
  };
}

export function TourInstanceInfoCard({ tourInstanceBooking }: TourInstanceInfoCardProps) {
  const { t } = useTranslation();

  const isPublic = tourInstanceBooking.instanceType === "public" || tourInstanceBooking.instanceType === "Public";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
      <div className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {isPublic ? (
            <>
              <Icon icon="heroicons:check-circle" className="size-12 text-green-500 mb-2" />
              <p className="text-lg font-semibold text-green-600 mb-2">
                {t("landing.checkout.bookingConfirmed")}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {t("landing.checkout.publicInstanceMessage")}
              </p>
            </>
          ) : (
            <>
              <Icon icon="heroicons:clock" className="size-12 text-blue-500 mb-2" />
              <p className="text-lg font-semibold text-blue-600 mb-2">
                {t("landing.checkout.bookingPending")}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {t("landing.checkout.privateInstanceMessage")}
              </p>
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-left w-full max-w-md">
            <h4 className="font-semibold text-slate-900 mb-2">{tourInstanceBooking.tourName}</h4>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon icon="heroicons:map-pin" className="size-3.5 text-gray-400 shrink-0" />
              {tourInstanceBooking.location || "N/A"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Icon icon="heroicons:calendar" className="size-3.5 text-gray-400 shrink-0" />
              {tourInstanceBooking.startDate} - {tourInstanceBooking.endDate}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 mt-2">
              <Icon icon="heroicons:banknotes" className="size-3.5 text-orange-500 shrink-0" />
              {t("landing.checkout.deposit")}: {fmtCurrency(tourInstanceBooking.depositPerPerson)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
              <Icon icon="heroicons:information-circle" className="size-3.5 text-gray-400 shrink-0" />
              {tourInstanceBooking.bookingType === "InstanceJoin"
                ? t("landing.checkout.instanceJoin")
                : t("landing.checkout.tourBooking")}
              {" | "}
              {isPublic ? t("landing.checkout.public") : t("landing.checkout.private")}
            </div>
          </div>

          <Link href="/bookings" className="text-sm text-orange-500 hover:underline mt-4">
            {t("landing.checkout.viewMyBookings")}
          </Link>
        </div>
      </div>
    </div>
  );
}
