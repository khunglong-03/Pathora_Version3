"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { taxConfigService } from "@/api/services/taxConfigService";
import type { TaxConfig } from "@/types/taxConfig";
import { TaxConfigList } from "./TaxConfigList";
import { TaxConfigForm } from "./TaxConfigForm";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

export function TaxConfigsPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingConfig, setEditingConfig] = useState<TaxConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingConfig(null);
    setView("form");
  };

  const handleEdit = (config: TaxConfig) => {
    setEditingConfig(config);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("taxConfig.confirmDelete"))) {
      return;
    }

    const response = await taxConfigService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || t("taxConfig.deleteFailed"));
    }
  };

  const handleFormSuccess = () => {
    setView("list");
    setEditingConfig(null);
    setRefreshKey((k) => k + 1);
  };

  const handleFormCancel = () => {
    setView("list");
    setEditingConfig(null);
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
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{t("taxConfig.pageSubtitle")}</p>
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
              {t("taxConfig.addTax")}
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
            <TaxConfigList
              onEdit={handleEdit}
              onDelete={handleDelete}
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
                {editingConfig ? t("taxConfig.form.editTitle") : t("taxConfig.form.createTitle")}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {editingConfig
                  ? t("taxConfig.form.editSubtitle", "Update an existing tax configuration.")
                  : t("taxConfig.form.createSubtitle", "Add a new tax configuration for your tours.")}
              </p>
            </div>
            <TaxConfigForm
              config={editingConfig}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
