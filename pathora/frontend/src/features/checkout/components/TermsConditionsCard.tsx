"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui";
import { CANCELLATION_KEYS, PAYMENT_TERM_KEYS, IMPORTANT_INFO_KEYS } from "./checkoutHelpers";

interface TermsConditionsCardProps {
  agreeTerms: boolean;
  setAgreeTerms: (v: boolean) => void;
  acknowledgeInfo: boolean;
  setAcknowledgeInfo: (v: boolean) => void;
}

function PolicySection({
  icon,
  iconBg,
  iconColor,
  title,
  items,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`size-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon icon={icon} className={`size-4 ${iconColor}`} />
        </div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      <ul className="flex flex-col gap-1.5 pl-10">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 leading-4">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TermsConditionsCard({
  agreeTerms,
  setAgreeTerms,
  acknowledgeInfo,
  setAcknowledgeInfo,
}: TermsConditionsCardProps) {
  const { t } = useTranslation();

  const cancellationItems = CANCELLATION_KEYS.map((k) => t(k));
  const paymentTermItems = PAYMENT_TERM_KEYS.map((k) => t(k));
  const importantInfoItems = IMPORTANT_INFO_KEYS.map((k) => t(k));

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 md:p-10">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-6">
          {t("landing.checkout.termsConditions")}
        </h3>
        
        <div className="flex flex-col gap-6">
          <PolicySection
            icon="heroicons:shield-check"
            iconBg="bg-green-50"
            iconColor="text-green-600"
            title={t("landing.checkout.cancellationPolicy")}
            items={cancellationItems}
          />
          <PolicySection
            icon="heroicons:credit-card"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            title={t("landing.checkout.paymentTerms")}
            items={paymentTermItems}
          />
          <PolicySection
            icon="heroicons:exclamation-circle"
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            title={t("landing.checkout.importantInfo")}
            items={importantInfoItems}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
          <Checkbox
            value={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
            activeClass="!bg-zinc-900 !ring-zinc-900 !border-zinc-900"
            label={
              <span className="text-sm text-slate-600 font-medium leading-relaxed">
                {t("landing.checkout.agreeTermsPrefix")}{" "}
                <span className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 cursor-pointer">{t("landing.checkout.cancellationPolicyLink")}</span>{" "}
                {t("landing.checkout.and")}{" "}
                <span className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 cursor-pointer">{t("landing.checkout.paymentTermsLink")}</span>
              </span>
            }
          />
          <Checkbox
            value={acknowledgeInfo}
            onChange={() => setAcknowledgeInfo(!acknowledgeInfo)}
            activeClass="!bg-zinc-900 !ring-zinc-900 !border-zinc-900"
            label={
              <span className="text-sm text-slate-600 font-medium leading-relaxed">
                {t("landing.checkout.acknowledgePrefix")}{" "}
                <span className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 cursor-pointer">{t("landing.checkout.importantInfoLink")}</span>{" "}
                {t("landing.checkout.acknowledgeSuffix")}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}
