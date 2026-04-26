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
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10 flex flex-col items-center text-center">
        {isPublic ? (
          <div className="flex flex-col items-center mb-8">
            <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Icon icon="heroicons:check" className="size-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              {t("landing.checkout.bookingConfirmed")}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm">
              {t("landing.checkout.publicInstanceMessage")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Icon icon="heroicons:clock" className="size-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              {t("landing.checkout.bookingPending")}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm">
              {t("landing.checkout.privateInstanceMessage")}
            </p>
          </div>
        )}

        <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 text-left relative overflow-hidden group">
          {/* subtle liquid glass effect line */}
          <div className="absolute inset-0 border border-white/50 rounded-3xl pointer-events-none" />
          
          <h4 className="font-semibold text-lg tracking-tight text-slate-900 mb-4 pr-8">{tourInstanceBooking.tourName}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Location</span>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Icon icon="heroicons:map-pin" className="size-4 text-slate-400" />
                <span className="font-medium">{tourInstanceBooking.location || "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Dates</span>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Icon icon="heroicons:calendar" className="size-4 text-slate-400" />
                <span className="font-medium font-mono">{tourInstanceBooking.startDate} — {tourInstanceBooking.endDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
                {tourInstanceBooking.bookingType === "InstanceJoin" ? t("landing.checkout.instanceJoin") : t("landing.checkout.tourBooking")}
              </div>
              <div className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
                {isPublic ? t("landing.checkout.public") : t("landing.checkout.private")}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Deposit Required</span>
              <span className="text-lg font-bold text-zinc-900">{fmtCurrency(tourInstanceBooking.depositPerPerson)}</span>
            </div>
          </div>
        </div>

        <Link href="/bookings" className="mt-8 text-sm font-medium text-slate-500 hover:text-zinc-900 underline decoration-slate-300 underline-offset-4 hover:decoration-zinc-900 transition-all">
          {t("landing.checkout.viewMyBookings")}
        </Link>
      </div>
    </div>
  );
}
