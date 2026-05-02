"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { CheckoutPriceResponse } from "@/api/services/paymentService";
import { fmtCurrency } from "./checkoutHelpers";
import i18n from "@/i18n/config";

interface BookingSummarySectionProps {
  checkoutPrice: CheckoutPriceResponse | null;
  totalPrice: number;
  loadingPrice: boolean;
  priceError: string | null;
}

export function BookingSummarySection({
  checkoutPrice,
  totalPrice,
  loadingPrice,
  priceError,
}: BookingSummarySectionProps) {
  const { t } = useTranslation();

  if (loadingPrice) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-8 md:p-10 flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-8">{t("landing.checkout.bookingSummary")}</h3>
          <div className="size-12 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
        </div>
      </div>
    );
  }

  if (priceError || !checkoutPrice) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-8 md:p-10 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Icon icon="heroicons:exclamation-circle" className="size-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">{t("landing.checkout.bookingSummary")}</h3>
          <p className="text-sm text-red-500 max-w-sm">{priceError || "No booking found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-8">{t("landing.checkout.bookingSummary")}</h3>

        {/* Tour info row */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-32 aspect-video md:aspect-square rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={checkoutPrice.thumbnailUrl || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800"}
              alt={checkoutPrice.tourName}
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <h4 className="text-lg font-semibold tracking-tight text-slate-900 leading-snug mb-3">{checkoutPrice.tourName}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Icon icon="heroicons:map-pin" className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">{checkoutPrice.location || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Icon icon="heroicons:clock" className="size-4 shrink-0 text-slate-400" />
                <span>{checkoutPrice.durationDays} {checkoutPrice.durationDays === 1 ? t("landing.checkout.day") : t("landing.checkout.days")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Icon icon="heroicons:calendar" className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">
                  {new Date(checkoutPrice.startDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {" — "}
                  {new Date(checkoutPrice.endDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Icon icon="heroicons:users" className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">
                  {t("landing.checkout.adultsCount", { count: checkoutPrice.numberAdult })}
                  {checkoutPrice.numberChild > 0 && `, ${t("landing.checkout.childrenCount", { count: checkoutPrice.numberChild })}`}
                  {checkoutPrice.numberInfant > 0 && `, ${t("landing.checkout.infantsCount", { count: checkoutPrice.numberInfant })}`}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold tracking-wide font-mono">
                {checkoutPrice.tourCode}
              </span>
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
          <h4 className="text-sm font-semibold tracking-tight text-slate-900 mb-4">{t("landing.checkout.priceDetails")}</h4>
          <div className="flex flex-col gap-3">
            {checkoutPrice.numberAdult > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t("landing.checkout.adults")} <span className="text-slate-300 mx-1">×</span> {checkoutPrice.numberAdult}</span>
                <span className="font-medium text-slate-900">{fmtCurrency(checkoutPrice.adultSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.numberChild > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t("landing.checkout.children")} <span className="text-slate-300 mx-1">×</span> {checkoutPrice.numberChild}</span>
                <span className="font-medium text-slate-900">{fmtCurrency(checkoutPrice.childSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.numberInfant > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t("landing.checkout.infants")} <span className="text-slate-300 mx-1">×</span> {checkoutPrice.numberInfant}</span>
                <span className="font-medium text-slate-900">{fmtCurrency(checkoutPrice.infantSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-500">{t("landing.checkout.tax")} ({checkoutPrice.taxRate}%)</span>
                <span className="font-medium text-slate-900">{fmtCurrency(checkoutPrice.taxAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-500">{t("landing.checkout.serviceFee")}</span>
              <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">{t("landing.checkout.free")}</span>
            </div>
            
            <div className="my-2 border-t border-slate-200/60 border-dashed" />
            
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold tracking-tight text-slate-900">{t("landing.checkout.total")}</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900">{fmtCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
