"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pricingPolicyService } from "@/api/services/pricingPolicyService";
import type { PricingPolicy } from "@/types/pricingPolicy";
import { PricingPolicyList } from "./PricingPolicyList";
import { PricingPolicyForm } from "./PricingPolicyForm";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

export function PricingPoliciesPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingPolicy, setEditingPolicy] = useState<PricingPolicy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingPolicy(null);
    setView("form");
  };

  const handleEdit = (policy: PricingPolicy) => {
    setEditingPolicy(policy);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("pricingPolicy.confirmDelete", "Are you sure you want to delete this pricing policy?"))) {
      return;
    }

    const response = await pricingPolicyService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("pricingPolicy.deleteFailed", "Failed to delete pricing policy"));
    }
  };

  const handleToggleActive = async (policy: PricingPolicy) => {
    const response = await pricingPolicyService.update({
      id: policy.id,
      name: policy.name,
      tourType: policy.tourType,
      tiers: policy.tiers,
      translations: policy.translations,
      status: policy.status === 1 ? 2 : 1,
    });
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("pricingPolicy.toggleFailed", "Failed to update policy status"));
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
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{t("pricingPolicy.pageSubtitle", "Manage age-based pricing rules for tours")}</p>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-2xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_-4px_rgba(201,135,58,0.35)]"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("pricingPolicy.addPolicy", "Add Policy")}
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
            <PricingPolicyList
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                {editingPolicy
                  ? t("pricingPolicy.editPolicy", "Edit Pricing Policy")
                  : t("pricingPolicy.createPolicy", "Create Pricing Policy")}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {editingPolicy
                  ? t("pricingPolicy.editSubtitle", "Update pricing policy and tier configurations")
                  : t("pricingPolicy.createSubtitle", "Set up a new pricing policy with age-based tiers")}
              </p>
            </div>
            <PricingPolicyForm
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
