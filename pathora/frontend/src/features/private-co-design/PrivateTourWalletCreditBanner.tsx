"use client";

import React from "react";
import { Wallet } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export interface PrivateTourWalletCreditBannerProps {
  creditAmountVnd: number;
}

/** Banner when FinalSellPrice settlement credited customer wallet (Delta &lt; 0). */
export function PrivateTourWalletCreditBanner({ creditAmountVnd }: PrivateTourWalletCreditBannerProps) {
  const { t } = useTranslation();
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(creditAmountVnd);

  return (
    <div
      role="status"
      data-testid="private-tour-wallet-credit-banner"
      className="flex gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-emerald-950 shadow-sm"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
        <Wallet weight="fill" className="size-5 text-emerald-700" aria-hidden />
      </div>
      <p className="text-sm font-semibold leading-snug pt-1">
        {t("landing.privateCoDesign.walletCreditBanner", { amount: formatted })}
      </p>
    </div>
  );
}
