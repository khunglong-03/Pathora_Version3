"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cancellationPolicyService } from "@/api/services/cancellationPolicyService";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import { CancellationPolicyList } from "./CancellationPolicyList";
import { CancellationPolicyForm } from "./CancellationPolicyForm";
import { Icon } from "@/components/ui/Icon";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function CancellationPoliciesPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingPolicy, setEditingPolicy] = useState<CancellationPolicy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingPolicy(null);
    setView("form");
  };

  const handleEdit = (policy: CancellationPolicy) => {
    setEditingPolicy(policy);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("cancellationPolicy.confirm.delete", "Are you sure you want to delete this cancellation policy?"))) {
      return;
    }

    const response = await cancellationPolicyService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("cancellationPolicy.error.deleteFailed", "Failed to delete cancellation policy"));
    }
  };

  const handleToggleActive = async (policy: CancellationPolicy) => {
    const updateData = {
      id: policy.id,
      tourScope: policy.tourScope,
      tiers: policy.tiers,
      status: policy.status === 1 ? 2 : 1,
      translations: policy.translations,
    };

    const response = await cancellationPolicyService.update(updateData);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("cancellationPolicy.error.toggleFailed", "Failed to update policy status"));
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
    <div className="space-y-8 max-w-[87.5rem] mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-end justify-between gap-6"
      >
        <motion.div variants={itemVariants} className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200">
              <Icon icon="heroicons:clipboard-document-check" className="size-4 text-amber-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              {t("cancellationPolicy.label.badge", "Policies")}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight leading-none">
            {t("cancellationPolicy.pageTitle", "Cancellation Policies")}
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-[55ch] leading-relaxed">
            {t("cancellationPolicy.pageSubtitle", "Define refund rules based on how far in advance customers cancel their bookings.")}
          </p>
        </motion.div>
        {view === "list" && (
          <motion.button
            variants={itemVariants}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
          >
            <Plus className="size-4" />
            {t("cancellationPolicy.action.addPolicy", "Add Policy")}
          </motion.button>
        )}
      </motion.div>

      {view === "list" ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
          className="bg-white rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 overflow-hidden"
        >
          <CancellationPolicyList
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            refreshKey={refreshKey}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
          className="bg-white rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 overflow-hidden"
        >
          <div className="px-8 pt-8 pb-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 border border-amber-200">
                <Icon icon="heroicons:pencil-square" className="size-4 text-amber-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                {editingPolicy
                  ? t("cancellationPolicy.form.badgeEdit", "Editing")
                  : t("cancellationPolicy.form.badgeCreate", "Creating")}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight leading-tight">
              {editingPolicy
                ? t("cancellationPolicy.form.titleEdit", "Edit Cancellation Policy")
                : t("cancellationPolicy.form.titleCreate", "Create Cancellation Policy")}
            </h2>
          </div>
          <div className="p-8">
            <CancellationPolicyForm
              policy={editingPolicy}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Need to import Plus from phosphor
import { Plus } from "@phosphor-icons/react";
