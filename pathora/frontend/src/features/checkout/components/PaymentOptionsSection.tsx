"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import { fmtCurrency, DEFAULT_DEPOSIT_PERCENTAGE } from "./checkoutHelpers";

interface PaymentOptionsSectionProps {
  paymentOption: "full" | "deposit";
  setPaymentOption: (v: "full" | "deposit") => void;
  transaction: unknown | null;
  depositAmount: number;
  totalPrice: number;
  checkoutPrice: { depositPercentage?: number } | null;
}

export function PaymentOptionsSection({
  paymentOption,
  setPaymentOption,
  transaction,
  depositAmount,
  totalPrice,
  checkoutPrice,
}: PaymentOptionsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Full Payment */}
      <Button
        type="button"
        onClick={() => setPaymentOption("full")}
        disabled={!!transaction}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
          paymentOption === "full"
            ? "border-orange-500 bg-orange-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}>
        <div className="flex items-center gap-3">
          <div
            className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              paymentOption === "full" ? "border-orange-500" : "border-gray-300"
            }`}>
            {paymentOption === "full" && <div className="size-3 rounded-full bg-orange-500" />}
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold text-slate-900">
              {t("landing.checkout.fullPayment")}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {t("landing.checkout.fullPaymentDesc")}
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-slate-900">
          {fmtCurrency(totalPrice)}
        </span>
      </Button>

      {/* Deposit */}
      <Button
        type="button"
        onClick={() => setPaymentOption("deposit")}
        disabled={!!transaction}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
          paymentOption === "deposit"
            ? "border-orange-500 bg-orange-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}>
        <div className="flex items-center gap-3">
          <div
            className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              paymentOption === "deposit" ? "border-orange-500" : "border-gray-300"
            }`}>
            {paymentOption === "deposit" && <div className="size-3 rounded-full bg-orange-500" />}
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold text-slate-900">
              {t("landing.checkout.deposit")} ({Math.round((checkoutPrice?.depositPercentage ?? DEFAULT_DEPOSIT_PERCENTAGE) * 100)}%)
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {t("landing.checkout.depositDesc")}
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-slate-900">
          {fmtCurrency(depositAmount)}
        </span>
      </Button>
    </div>
  );
}
