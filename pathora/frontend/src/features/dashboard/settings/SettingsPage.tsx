"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SettingsNav, type SettingsTabMeta } from "./components/SettingsNav";
import { SettingsTabSkeleton } from "./components/SettingsTabSkeleton";
import { springTransition } from "./components/springTransition";

const GeneralTab = dynamic(() => import("./tabs/GeneralTab").then((mod) => mod.GeneralTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});
const TeamTab = dynamic(() => import("./tabs/TeamTab").then((mod) => mod.TeamTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});
const NotificationsTab = dynamic(() => import("./tabs/NotificationsTab").then((mod) => mod.NotificationsTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});
const SecurityTab = dynamic(() => import("./tabs/SecurityTab").then((mod) => mod.SecurityTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});
const BillingTab = dynamic(() => import("./tabs/BillingTab").then((mod) => mod.BillingTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});
const IntegrationsTab = dynamic(() => import("./tabs/IntegrationsTab").then((mod) => mod.IntegrationsTab), {
  ssr: false,
  loading: () => <SettingsTabSkeleton />,
});

// existing policy pages
const TaxConfigsPage = dynamic(
  () => import("@/features/dashboard/components/TaxConfigsPage").then((mod) => mod.TaxConfigsPage),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);
const PricingPoliciesPage = dynamic(
  () => import("@/features/dashboard/components/PricingPoliciesPage").then((mod) => mod.PricingPoliciesPage),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);
const DashboardPoliciesPage = dynamic(
  () => import("@/features/dashboard/components/DashboardPoliciesPage").then((mod) => mod.DashboardPoliciesPage),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);
const VisaPoliciesPage = dynamic(
  () => import("@/features/dashboard/components/VisaPoliciesPage").then((mod) => mod.VisaPoliciesPage),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);
const DepositPoliciesSettings = dynamic(
  () => import("@/features/dashboard/components/DepositPoliciesSettings").then((mod) => mod.DepositPoliciesSettings),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);
const CancellationPoliciesPage = dynamic(
  () => import("@/features/dashboard/components/CancellationPoliciesPage").then((mod) => mod.CancellationPoliciesPage),
  { ssr: false, loading: () => <SettingsTabSkeleton /> },
);

const VALID_TAB_IDS = [
  "general",
  "team",
  "tax-configs",
  "policies",
  "pricing-policies",
  "cancellation-policies",
  "deposit-policies",
  "visa-policies",
  "notifications",
  "security",
  "billing",
  "integrations",
] as const;

type SettingsTabId = (typeof VALID_TAB_IDS)[number];

function TabUrlSync({ onTabChange }: { onTabChange: (tab: SettingsTabId) => void }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (tab && VALID_TAB_IDS.includes(tab as SettingsTabId)) {
      onTabChange(tab as SettingsTabId);
    }
  }, [tab, onTabChange]);

  return null;
}

function renderTab(tab: SettingsTabId) {
  switch (tab) {
    case "general":
      return <GeneralTab />;
    case "team":
      return <TeamTab />;
    case "team":
      return <TeamTab />;
    case "tax-configs":
      return <TaxConfigsPage />;
    case "policies":
      return <DashboardPoliciesPage />;
    case "pricing-policies":
      return <PricingPoliciesPage />;
    case "cancellation-policies":
      return <CancellationPoliciesPage />;
    case "deposit-policies":
      return <DepositPoliciesSettings />;
    case "visa-policies":
      return <VisaPoliciesPage />;
    case "notifications":
      return <NotificationsTab />;
    case "security":
      return <SecurityTab />;
    case "billing":
      return <BillingTab />;
    case "integrations":
      return <IntegrationsTab />;
    default:
      return <GeneralTab />;
  }
}

export function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");

  const tabs: SettingsTabMeta[] = [
    { id: "general", label: t("settings.tabs.general") },
    { id: "team", label: t("settings.teamMembers.title") },
    { id: "tax-configs", label: t("settings.tabs.taxConfigs") },
    { id: "policies", label: t("settings.tabs.policies") },
    { id: "pricing-policies", label: t("settings.tabs.pricingPolicies") },
    { id: "cancellation-policies", label: t("settings.tabs.cancellationPolicies") },
    { id: "deposit-policies", label: t("settings.tabs.depositPolicies") },
    { id: "visa-policies", label: t("settings.tabs.visaPolicies") },
    { id: "notifications", label: t("settings.tabs.notifications") },
    { id: "security", label: t("settings.tabs.security") },
    { id: "billing", label: t("settings.tabs.billing") },
    { id: "integrations", label: t("settings.tabs.integrations") },
  ];

  const handleTabClick = (tabId: string) => {
    if (!VALID_TAB_IDS.includes(tabId as SettingsTabId)) return;
    const normalized = tabId as SettingsTabId;
    setActiveTab(normalized);
    router.replace(`/admin/settings?tab=${normalized}`);
  };

  return (
    <>
      <Suspense fallback={null}>
        <TabUrlSync onTabChange={setActiveTab} />
      </Suspense>

      <main id="main-content" className="px-4 pb-16 pt-6 lg:px-8 max-w-[87.5rem] mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                  {t("settings.pageTitle")}
                </h1>
                <p className="mt-1 text-sm text-stone-500">{t("settings.pageSubtitle")}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <div className="order-2 lg:order-1">
            <SettingsNav tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick} />
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={springTransition}
              >
                {renderTab(activeTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}

export default SettingsPage;
