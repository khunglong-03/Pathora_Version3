"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PricingPolicyTier } from "@/types/pricingPolicy";

const createUniqueId = () => `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
import { StarHalf, Trash, Plus } from "@phosphor-icons/react";

interface PricingTierInputProps {
  tiers: PricingPolicyTier[];
  onChange: (tiers: PricingPolicyTier[]) => void;
}

export function PricingTierInput({ tiers, onChange }: PricingTierInputProps) {
  const addTier = () => {
    const newTier: PricingPolicyTier = {
      id: createUniqueId(),
      label: "",
      ageFrom: 0,
      ageTo: null,
      pricePercentage: 100,
    };
    onChange([...tiers, newTier]);
  };

  const updateTier = (index: number, field: keyof PricingPolicyTier, value: string | number | null) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value ?? null };
    onChange(updated);
  };

  const removeTier = (index: number) => {
    const updated = tiers.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={addTier}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-600 text-sm font-semibold rounded-2xl border border-stone-200 hover:border-amber-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <Plus className="w-4 h-4" weight="bold" />
          Add Tier
        </motion.button>
      </div>

      {tiers.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
          <div className="w-12 h-12 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
            <StarHalf className="w-6 h-6 text-stone-400" weight="duotone" />
          </div>
          <p className="text-sm text-stone-500 font-medium">No tiers added yet</p>
          <p className="text-xs text-stone-400 mt-1">Click &ldquo;Add Tier&rdquo; to define an age-based pricing bracket</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id ?? `tier-new-${index}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
                className="rounded-3xl border border-stone-200/60 bg-stone-50/60 p-4 lg:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Tier number badge */}
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">{index + 1}</span>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Label */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Label
                      </label>
                      <input
                        type="text"
                        value={tier.label ?? ""}
                        onChange={(e) => updateTier(index, "label", e.target.value)}
                        placeholder="Adult, Child, Senior"
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>

                    {/* Age From */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Age From
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.ageFrom}
                        onChange={(e) => updateTier(index, "ageFrom", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>

                    {/* Age To */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Age To
                        <span className="ml-1 text-stone-300 font-normal normal-case"> (empty = no limit)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.ageTo ?? ""}
                        onChange={(e) =>
                          updateTier(index, "ageTo", e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono placeholder-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>

                    {/* Price Percentage */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Price %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tier.pricePercentage}
                          onChange={(e) =>
                            updateTier(index, "pricePercentage", parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 pr-7 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="shrink-0 pt-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeTier(index)}
                      className="w-8 h-8 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      title="Remove tier"
                    >
                      <Trash className="w-4 h-4" weight="regular" />
                    </motion.button>
                  </div>
                </div>

                {/* Info line */}
                <div className="mt-2.5 pl-12">
                  <p className="text-xs text-stone-400">
                    {tier.ageTo !== null && tier.ageTo !== undefined
                      ? `Ages ${tier.ageFrom} to ${tier.ageTo}`
                      : `Ages ${tier.ageFrom} and above`}
                    {" — "}
                    <span className="font-semibold text-stone-600">{tier.pricePercentage}%</span>
                    {" of adult base price"}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {tiers.length > 0 && (
        <p className="text-xs text-stone-400 pl-1">
          Price % is relative to the adult base price. For example, 75% means the child pays 75% of the adult price.
        </p>
      )}
    </div>
  );
}
