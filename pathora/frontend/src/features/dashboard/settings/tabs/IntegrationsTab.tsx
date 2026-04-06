"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  CreditCard,
  FileText,
  GearSix,
  PuzzlePiece,
} from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import { SectionCard } from "../components/SectionCard";
import { useIntegrationSettings } from "../hooks/useSettings";
import { springTransition } from "../components/springTransition";

const ICON_MAP = {
  CreditCard,
  FileText,
  GearSix,
  Calculator,
  PuzzlePiece,
} as const;

export function IntegrationsTab() {
  const { t } = useTranslation();
  const { integrations, isLoading, isUpdating, connect, disconnect } = useIntegrationSettings();

  return (
    <div className="space-y-3">
      {isLoading ? (
        <SectionCard>
          <div className="px-8 py-8 text-sm text-stone-500">Loading integrations...</div>
        </SectionCard>
      ) : integrations.length === 0 ? (
        <SectionCard>
          <div className="px-8 py-8 text-center">
            <p className="text-sm font-medium text-stone-700">No integrations configured</p>
            <p className="text-xs text-stone-500 mt-1">Connect external tools to extend your workspace.</p>
          </div>
        </SectionCard>
      ) : (
        integrations.map((integration, i) => {
          const IconComponent = ICON_MAP[integration.iconName as keyof typeof ICON_MAP] ?? GearSix;
          const loading = isUpdating === integration.id;

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: i * 0.06 }}
              className="flex items-center justify-between rounded-[2rem] bg-white border border-border px-6 py-4 shadow-card"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    integration.connected ? "bg-emerald-50" : "bg-stone-100"
                  }`}
                >
                  <IconComponent
                    className={`size-5 ${integration.connected ? "text-emerald-600" : "text-stone-400"}`}
                    weight="duotone"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{t(integration.nameKey)}</p>
                  <p className="text-xs text-stone-500">{t(integration.descKey)}</p>
                </div>
              </div>

              <Button
                disabled={loading}
                onClick={() => {
                  if (integration.connected) {
                    const shouldDisconnect = window.confirm("Disconnect this integration?");
                    if (!shouldDisconnect) return;
                    void disconnect(integration.id);
                  } else {
                    void connect(integration.id);
                  }
                }}
                className={integration.connected
                  ? "border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 active:scale-[0.98] transition-all text-xs disabled:opacity-60"
                  : "bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all text-xs disabled:opacity-60"
                }
              >
                {loading
                  ? "Updating..."
                  : integration.connected
                    ? t("settings.integrations.connected")
                    : t("settings.integrations.connect")}
              </Button>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

export default IntegrationsTab;
