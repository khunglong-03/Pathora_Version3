"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { DynamicPricingDto } from "@/types/tour";

const tierCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatTierCurrency = (value: number): string =>
  tierCurrencyFormatter.format(value).replace("VND", "VND").trim();

interface PricingTierCardProps {
  tier: DynamicPricingDto;
  base: number;
}

export function PricingTierCard({ tier, base }: PricingTierCardProps) {
  const { t } = useTranslation();
  const isCheaper = tier.pricePerPerson < base;

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:shadow-[var(--shadow-warm-sm)]"
      style={{
        background: isCheaper ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.04)" : "var(--tour-surface-raised)",
        border: `1px solid ${isCheaper ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.2)" : "var(--tour-divider)"}`,
      }}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold" style={{ color: "var(--tour-heading)" }}>
          {tier.minParticipants}–{tier.maxParticipants === 9999 ? "∞" : tier.maxParticipants} {t("tourInstance.people", "people")}
        </span>
        {isCheaper && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block w-fit" style={{ background: "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)", color: "var(--landing-accent)" }}>
            {t("tourInstance.groupDiscount", "Group discount")}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className="text-[15px] font-extrabold tabular-nums"
          style={{ color: isCheaper ? "var(--landing-accent)" : "var(--tour-heading)" }}>
          {formatTierCurrency(tier.pricePerPerson)}
        </span>
        <span className="text-[10px]" style={{ color: "var(--tour-caption)" }}>
          {t("tourInstance.perPerson", "/person")}
        </span>
      </div>
    </div>
  );
}
