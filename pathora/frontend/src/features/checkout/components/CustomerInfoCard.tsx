"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import InputGroup from "@/components/ui/InputGroup";

interface CustomerInfoCardProps {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
}

export function CustomerInfoCard({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
}: CustomerInfoCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {t("landing.checkout.customerInfo")}
        </h3>
        <div className="flex flex-col gap-4">
          <InputGroup
            type="text"
            label={t("landing.checkout.fullName")}
            placeholder={t("landing.checkout.fullNamePlaceholder")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            id="customer-name"
          />
          <InputGroup
            type="tel"
            label={t("landing.checkout.phone")}
            placeholder={t("landing.checkout.phonePlaceholder")}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            id="customer-phone"
          />
          <InputGroup
            type="email"
            label={t("landing.checkout.email")}
            placeholder={t("landing.checkout.emailPlaceholder")}
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            id="customer-email"
          />
        </div>
      </div>
    </div>
  );
}
