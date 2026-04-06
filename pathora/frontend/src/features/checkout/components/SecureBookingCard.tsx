"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

export function SecureBookingCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
          <Icon icon="heroicons:shield-check" className="size-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{t("landing.checkout.secureBooking")}</p>
          <p className="text-[10px] text-gray-400">{t("landing.checkout.dataProtected")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[
          t("landing.checkout.sslEncrypted"),
          t("landing.checkout.noPaymentUntilConfirmed"),
          t("landing.checkout.support247"),
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Icon icon="heroicons:check" className="size-3.5 text-green-500 shrink-0" />
            <span className="text-xs text-gray-600">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
