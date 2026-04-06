"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { visaPolicyService } from "@/api/services/visaPolicyService";
import type { VisaPolicy, UpdateVisaPolicyRequest } from "@/types/visaPolicy";
import { VisaPolicyList } from "./VisaPolicyList";
import { VisaPolicyForm } from "./VisaPolicyForm";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

export function VisaPoliciesPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingPolicy, setEditingPolicy] = useState<VisaPolicy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingPolicy(null);
    setView("form");
  };

  const handleEdit = (policy: VisaPolicy) => {
    setEditingPolicy(policy);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("visaPolicy.confirmDelete"))) {
      return;
    }

    const response = await visaPolicyService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("visaPolicy.deleteFailed"));
    }
  };

  const handleToggleActive = async (policy: VisaPolicy) => {
    const updateData = {
      id: policy.id,
      region: policy.region,
      processingDays: policy.processingDays,
      bufferDays: policy.bufferDays,
      fullPaymentRequired: policy.fullPaymentRequired,
      isActive: !policy.isActive,
    };

    const response = await visaPolicyService.update(updateData as UpdateVisaPolicyRequest);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("visaPolicy.updateFailed"));
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
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{t("visaPolicy.pageSubtitle")}</p>
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
              {t("visaPolicy.add")}
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
            <VisaPolicyList
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
            className="bg-white rounded-[2rem] border border-border shadow-card p-8 max-w-2xl"
          >
            {/* Form header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {editingPolicy ? (
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  ) : (
                    <path d="M12 5v14M5 12h14" />
                  )}
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                {editingPolicy ? t("visaPolicy.edit") : t("visaPolicy.create")}
              </h2>
            </div>
            <VisaPolicyForm
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
