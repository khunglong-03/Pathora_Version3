"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import type { DepositPolicy } from "@/types/depositPolicy";
import { DepositPolicyList } from "./DepositPolicyList";
import { DepositPolicyForm } from "./DepositPolicyForm";
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

export function DepositPoliciesPage() {
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
    if (!confirm("Are you sure you want to delete this deposit policy?")) {
      return;
    }

    const response = await depositPolicyService.delete(id);
    if (response.success) {
      setRefreshKey((k) => k + 1);
    } else {
      alert(response.error?.[0]?.message || "Failed to delete deposit policy");
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
      alert(response.error?.[0]?.message || "Failed to update deposit policy");
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
              <Icon icon="heroicons:banknotes" className="size-4 text-amber-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Policies
            </span>
          </div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight leading-none">
            Deposit Policies
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-[55ch] leading-relaxed">
            Manage deposit requirements and payment rules based on booking timing.
          </p>
        </motion.div>
        {view === "list" && (
          <motion.button
            variants={itemVariants}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add Policy
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
          <DepositPolicyList
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
                {editingPolicy ? "Editing" : "Creating"}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight leading-tight">
              {editingPolicy ? "Edit Deposit Policy" : "Create Deposit Policy"}
            </h2>
          </div>
          <div className="p-8">
            <DepositPolicyForm
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

import { Plus } from "@phosphor-icons/react";
