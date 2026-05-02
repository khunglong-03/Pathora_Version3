"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";

export function SecureBookingCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <Icon icon="heroicons:shield-check" className="size-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-slate-900">{t("landing.checkout.secureBooking")}</p>
          <p className="text-xs text-slate-500">{t("landing.checkout.dataProtected")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[
          t("landing.checkout.sslEncrypted"),
          t("landing.checkout.noPaymentUntilConfirmed"),
          t("landing.checkout.support247"),
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Icon icon="heroicons:check-circle" className="size-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-slate-600">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
