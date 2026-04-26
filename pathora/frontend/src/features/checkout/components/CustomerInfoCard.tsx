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
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10">
        <div className="mb-8">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            {t("landing.checkout.customerInfo")}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Please provide your contact details for this booking.
          </p>
        </div>
        
        <div className="flex flex-col gap-6">
          <InputGroup
            type="text"
            label={t("landing.checkout.fullName")}
            placeholder={t("landing.checkout.fullNamePlaceholder")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            id="customer-name"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}
