"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import type { DepositPolicy } from "@/types/depositPolicy";
import { DepositPolicyList } from "./DepositPolicyList";
import { DepositPolicyForm } from "./DepositPolicyForm";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

export function DepositPoliciesSettings() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingPolicy, setEditingPolicy] = useState<DepositPolicy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingPolicy(null);
    setView("form");
  };

  const handleEdit = (policy: DepositPolicy) => {
    setEditingPolicy(policy);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("depositPolicy.confirmDelete", "Are you sure you want to delete this deposit policy?"))) {
      return;
    }

    const response = await depositPolicyService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("depositPolicy.deleteFailed", "Failed to delete deposit policy"));
    }
  };

  const handleToggleActive = async (policy: DepositPolicy) => {
    const updateData = {
      id: policy.id,
      tourScope: policy.tourScope,
      depositType: policy.depositType,
      depositValue: policy.depositValue,
      minDaysBeforeDeparture: policy.minDaysBeforeDeparture,
      isActive: !policy.isActive,
    };

    const response = await depositPolicyService.update(updateData);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("depositPolicy.updateFailed", "Failed to update deposit policy"));
    }
  };

  const handleFormSuccess = () => {
    setView("list");
    setEditingPolicy(null);
    setRefreshKey((k) => k + 1);
  };

  const handleFormCancel = () => {
    setView("list");
    setEditingPolicy(null);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">
            {t("depositPolicy.pageSubtitle", "Manage deposit requirements for tours — percentage or fixed amount")}
          </p>
        </div>
        <AnimatePresence>
          {view === "list" && (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springTransition}
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("depositPolicy.addPolicy", "Add Policy")}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springTransition}
            className="bg-white rounded-[2rem] border border-border shadow-card overflow-hidden"
          >
            <DepositPolicyList
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              refreshKey={refreshKey}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springTransition}
            className="bg-white rounded-[2rem] border border-border shadow-card p-8"
          >
            <DepositPolicyForm
              policy={editingPolicy}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
