"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cancellationPolicyService } from "@/api/services/cancellationPolicyService";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import { pricingPolicyService } from "@/api/services/pricingPolicyService";
import { formatCurrency } from "@/utils/format";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { PolicySection } from "@/types/siteContent";

interface Result {
  sections: PolicySection[];
  loading: boolean;
  error: string | null;
}

const isActiveCancellation = (p: CancellationPolicy) => p.status === 1;
const isActivePricing = (p: PricingPolicy) => p.status === "Active";
const isActiveDeposit = (p: DepositPolicy) => p.isActive;

const pickLocaleDescription = (
  translations: Record<string, { description?: string }> | undefined,
  locale: string,
): string | undefined => {
  if (!translations) return undefined;
  return (
    translations[locale]?.description ||
    translations.vi?.description ||
    translations.en?.description
  );
};

export const useSystemPolicySections = (): Result => {
  const { i18n, t } = useTranslation();
  const locale = (i18n.resolvedLanguage || i18n.language || "vi").split("-")[0];

  const [sections, setSections] = useState<PolicySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cancelRes, depositRes, pricingRes] = await Promise.all([
          cancellationPolicyService.getAll().catch(() => null),
          depositPolicyService.getAll().catch(() => null),
          pricingPolicyService.getAll().catch(() => null),
        ]);

        if (cancelled) return;

        const cancelList: CancellationPolicy[] =
          (cancelRes?.success && cancelRes.data) || [];
        const depositList: DepositPolicy[] =
          (depositRes?.success && depositRes.data) || [];
        const pricingList: PricingPolicy[] =
          (pricingRes?.success && pricingRes.data) || [];

        const built: PolicySection[] = [];

        const activeCancel = cancelList.filter(isActiveCancellation);
        if (activeCancel.length > 0) {
          const items: string[] = [];
          for (const p of activeCancel) {
            const desc = pickLocaleDescription(p.translations, locale);
            const scope = p.tourScopeName || (p.tourScope === 2 ? "International" : "Domestic");
            const header = desc
              ? `${scope} — ${desc}`
              : `${scope} (${p.policyCode})`;
            items.push(header);
            for (const tier of p.tiers) {
              items.push(
                t("landing.policies.system.cancellationTier", {
                  defaultValue:
                    "Hủy {{min}}–{{max}} ngày trước khởi hành: phí {{penalty}}%",
                  min: tier.minDaysBeforeDeparture,
                  max: tier.maxDaysBeforeDeparture,
                  penalty: tier.penaltyPercentage,
                }),
              );
            }
          }
          built.push({
            id: "system-cancellation",
            icon: "heroicons-outline:x-circle",
            title: t("landing.policies.system.cancellationTitle", {
              defaultValue: "Chính sách hủy & hoàn tiền",
            }),
            items,
          });
        }

        const activeDeposit = depositList.filter(isActiveDeposit);
        if (activeDeposit.length > 0) {
          const items: string[] = [];
          for (const p of activeDeposit) {
            const desc = pickLocaleDescription(p.translations, locale);
            const scope = p.tourScopeName || (p.tourScope === 2 ? "International" : "Domestic");
            const valueLabel =
              p.depositType === 1
                ? `${p.depositValue}%`
                : formatCurrency(p.depositValue);
            items.push(
              t("landing.policies.system.depositLine", {
                defaultValue:
                  "{{scope}}: đặt cọc {{value}}, tối thiểu {{days}} ngày trước khởi hành.",
                scope,
                value: valueLabel,
                days: p.minDaysBeforeDeparture,
              }),
            );
            if (desc) items.push(desc);
          }
          built.push({
            id: "system-deposit",
            icon: "heroicons-outline:banknotes",
            title: t("landing.policies.system.depositTitle", {
              defaultValue: "Chính sách đặt cọc",
            }),
            items,
          });
        }

        const activePricing = pricingList.filter(isActivePricing);
        if (activePricing.length > 0) {
          const items: string[] = [];
          for (const p of activePricing) {
            const desc = pickLocaleDescription(
              p.translations as Record<string, { description?: string }> | undefined,
              locale,
            );
            const header = `${p.name}${p.isDefault ? " (Default)" : ""} — ${p.tourTypeName}`;
            items.push(header);
            if (desc) items.push(desc);
            for (const tier of p.tiers) {
              const ageRange =
                tier.ageTo === null
                  ? `${tier.ageFrom}+`
                  : `${tier.ageFrom}–${tier.ageTo}`;
              items.push(
                t("landing.policies.system.pricingTier", {
                  defaultValue: "{{label}} ({{age}} tuổi): {{pct}}% giá gốc",
                  label: tier.label,
                  age: ageRange,
                  pct: tier.pricePercentage,
                }),
              );
            }
          }
          built.push({
            id: "system-pricing",
            icon: "heroicons-outline:tag",
            title: t("landing.policies.system.pricingTitle", {
              defaultValue: "Chính sách giá theo độ tuổi",
            }),
            items,
          });
        }

        setSections(built);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load policies";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  return { sections, loading, error };
};
