"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";
import { SectionCard } from "../components/SectionCard";
import { springTransition } from "../components/springTransition";

export function BillingTab() {
  const { t } = useTranslation();

  const metrics = [
    { label: "settings.billing.apiCalls", value: "8,450 / 10,000", percent: "84.5%" },
    { label: "settings.billing.storageUsed", value: "2.4 / 10 GB", percent: "24%" },
    { label: "settings.teamMembers.title", value: "4 / 10", percent: "40%" },
  ];

  return (
    <SectionCard>
      {/* Plan header */}
      <div className="relative bg-stone-900 px-8 py-8 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">{t("settings.billing.title")}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{t("settings.billing.plan")}</p>
          <p className="mt-1 text-sm text-stone-400">{t("settings.billing.renewsOn")}</p>
        </div>
      </div>

      {/* Usage metrics */}
      <div className="divide-y divide-border">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between px-8 py-4">
            <span className="text-sm text-stone-600">{t(metric.label)}</span>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-stone-100">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: metric.percent }}
                  transition={{ ...springTransition, delay: 0.1 + idx * 0.1 }}
                />
              </div>
              <span className="text-sm font-semibold text-stone-900 tabular-nums">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 px-8 py-6 border-t border-border">
        <Button className="bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all">
          {t("settings.billing.upgradePlan")}
        </Button>
        <Button className="border border-border text-stone-600 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all">
          {t("settings.billing.viewInvoices")}
        </Button>
      </div>
    </SectionCard>
  );
}

export default BillingTab;
