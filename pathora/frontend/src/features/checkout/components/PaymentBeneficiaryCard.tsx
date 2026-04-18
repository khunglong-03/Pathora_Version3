"use client";

import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui";
import type { PaymentTransaction } from "@/api/services/paymentService";

import { copyToClipboard } from "./checkoutHelpers";
import { resolvePaymentBeneficiaryDetails } from "./paymentBankDetails";

interface PaymentBeneficiaryCardProps {
  transaction: PaymentTransaction | null;
  className?: string;
}

export function PaymentBeneficiaryCard({ transaction, className = "" }: PaymentBeneficiaryCardProps) {
  const { t } = useTranslation();
  const details = resolvePaymentBeneficiaryDetails(transaction);

  return (
    <div className={`bg-blue-50 rounded-xl p-4 border border-blue-100 ${className}`.trim()}>
      <div className="flex items-center gap-2 mb-3">
        <Icon icon="heroicons:building-library" className="size-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-slate-900">{t("landing.checkout.bankAccountInfo")}</h4>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{t("landing.checkout.bankName")}</span>
          <span className="text-sm font-semibold text-slate-900 text-right">{details.bankName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{t("landing.checkout.accountNumber")}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 font-mono">{details.accountNumber}</span>
            <button
              type="button"
              aria-label={t("landing.checkout.copyAccountNumber")}
              onClick={() => copyToClipboard(details.accountNumber, t("landing.checkout.copied"))}
              className="size-6 rounded-md bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors cursor-pointer">
              <Icon icon="heroicons:clipboard-document" className="size-3.5 text-blue-600" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{t("landing.checkout.accountHolder")}</span>
          <span className="text-sm font-semibold text-slate-900 text-right">{details.accountHolder}</span>
        </div>
      </div>
    </div>
  );
}
