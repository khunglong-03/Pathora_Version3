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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
        <div className="p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">{t("landing.checkout.bookingSummary")}</h3>
          <div className="flex items-center justify-center py-8">
            <Icon icon="heroicons:arrow-path" className="size-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (priceError || !checkoutPrice) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
        <div className="p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">{t("landing.checkout.bookingSummary")}</h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon icon="heroicons:exclamation-circle" className="size-10 text-red-500 mb-2" />
            <p className="text-sm text-red-500">{priceError || "No booking found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">{t("landing.checkout.bookingSummary")}</h3>

        {/* Tour info row */}
        <div className="flex gap-4 mb-4">
          <div className="size-24 md:size-28 rounded-xl bg-gray-200 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={checkoutPrice.thumbnailUrl || "/placeholder-tour.jpg"}
              alt={checkoutPrice.tourName}
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-5 line-clamp-2">{checkoutPrice.tourName}</h4>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon icon="heroicons:map-pin" className="size-3.5 shrink-0 text-gray-400" />
              {checkoutPrice.location || "N/A"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon icon="heroicons:clock" className="size-3.5 shrink-0 text-gray-400" />
              {checkoutPrice.durationDays} {checkoutPrice.durationDays === 1 ? t("landing.checkout.day") : t("landing.checkout.days")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon icon="heroicons:calendar" className="size-3.5 shrink-0 text-gray-400" />
              {new Date(checkoutPrice.startDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
              {" - "}
              {new Date(checkoutPrice.endDate).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon icon="heroicons:users" className="size-3.5 shrink-0 text-gray-400" />
              {t("landing.checkout.adultsCount", { count: checkoutPrice.numberAdult })}
              {checkoutPrice.numberChild > 0 && t("landing.checkout.childrenCount", { count: checkoutPrice.numberChild })}
              {checkoutPrice.numberInfant > 0 && t("landing.checkout.infantsCount", { count: checkoutPrice.numberInfant })}
            </div>
            <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-semibold mt-1">
              {checkoutPrice.tourCode}
            </span>
          </div>
        </div>

        {/* Price Details */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">{t("landing.checkout.priceDetails")}</h4>
          <div className="flex flex-col gap-2">
            {checkoutPrice.numberAdult > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("landing.checkout.adults")} × {checkoutPrice.numberAdult}</span>
                <span className="font-semibold text-slate-900">{fmtCurrency(checkoutPrice.adultSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.numberChild > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("landing.checkout.children")} × {checkoutPrice.numberChild}</span>
                <span className="font-semibold text-slate-900">{fmtCurrency(checkoutPrice.childSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.numberInfant > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("landing.checkout.infants")} × {checkoutPrice.numberInfant}</span>
                <span className="font-semibold text-slate-900">{fmtCurrency(checkoutPrice.infantSubtotal)}</span>
              </div>
            )}
            {checkoutPrice.taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("landing.checkout.tax")} ({checkoutPrice.taxRate}%)</span>
                <span className="font-semibold text-slate-900">{fmtCurrency(checkoutPrice.taxAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t("landing.checkout.serviceFee")}</span>
              <span className="font-semibold text-green-500">{t("landing.checkout.free")}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-slate-900">{t("landing.checkout.total")}</span>
              <span className="text-xl font-bold text-orange-500">{fmtCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
