"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DynamicPricingDto } from "@/types/tour";
import { Plus, Trash, StarHalf } from "@phosphor-icons/react";

interface PricingTierEditorProps {
  title: string;
  subtitle?: string;
  tiers: DynamicPricingDto[];
  saving?: boolean;
  saveLabel?: string;
  infoMessage?: string;
  allowClear?: boolean;
  clearing?: boolean;
  clearLabel?: string;
  onChange: (tiers: DynamicPricingDto[]) => void;
  onSave: () => void;
  onClear?: () => void;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN");

const validateTiers = (tiers: DynamicPricingDto[]): string | null => {
  for (const tier of tiers) {
    if (tier.minParticipants <= 0) {
      return "Min participants must be greater than 0.";
    }

    if (tier.maxParticipants < tier.minParticipants) {
      return "Max participants must be greater than or equal to min participants.";
    }

    if (tier.pricePerPerson < 0) {
      return "Price per person must not be negative.";
    }
  }

  const ordered = [...tiers]
    .sort((left, right) => {
      if (left.minParticipants !== right.minParticipants) {
        return left.minParticipants - right.minParticipants;
      }

      return left.maxParticipants - right.maxParticipants;
    });

  for (let index = 1; index < ordered.length; index++) {
    if (ordered[index].minParticipants <= ordered[index - 1].maxParticipants) {
      return "Participant ranges must not overlap.";
    }
  }

  return null;
};

export function PricingTierEditor({
  title,
  subtitle,
  tiers,
  saving = false,
  saveLabel = "Save pricing tiers",
  infoMessage,
  allowClear = false,
  clearing = false,
  clearLabel = "Clear overrides",
  onChange,
  onSave,
  onClear,
}: PricingTierEditorProps) {
  const validationError = useMemo(() => validateTiers(tiers), [tiers]);

  const updateTier = (
    index: number,
    key: keyof DynamicPricingDto,
    value: number,
  ) => {
    const next = [...tiers];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addTier = () => {
    const sorted = [...tiers].sort(
      (left, right) => left.maxParticipants - right.maxParticipants,
    );

    const nextStart = sorted.length > 0 ? sorted[sorted.length - 1].maxParticipants + 1 : 1;

    onChange([
      ...tiers,
      {
        minParticipants: nextStart,
        maxParticipants: nextStart,
        pricePerPerson: 0,
      },
    ]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
      className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 bg-white p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={addTier}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-600 text-sm font-semibold rounded-2xl border border-stone-200 hover:border-amber-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" weight="bold" />
          Add tier
        </motion.button>
      </div>

      {/* Info message */}
      {infoMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 text-sm text-blue-700 flex items-start gap-2.5"
        >
          <svg className="shrink-0 w-4 h-4 mt-0.5" viewBox="0 0 16 16" fill="none">
            <path d="M8 7.25V11M8 4.25H8.01M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          {infoMessage}
        </motion.div>
      )}

      {/* Tier list */}
      {tiers.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
          <div className="w-12 h-12 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
            <StarHalf className="w-6 h-6 text-stone-400" weight="duotone" />
          </div>
          <p className="text-sm text-stone-500 font-medium">No pricing tiers configured</p>
          <p className="text-xs text-stone-400 mt-1">Add a tier to define pricing by group size</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tiers.map((tier, index) => (
              <motion.div
                key={`${tier.minParticipants}-${tier.maxParticipants}-${index}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
                className="rounded-3xl border border-stone-200/60 bg-stone-50/60 p-4 lg:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Tier badge */}
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">{index + 1}</span>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Min
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={tier.minParticipants}
                        onChange={(event) =>
                          updateTier(index, "minParticipants", Number(event.target.value || 0))
                        }
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Max
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={tier.maxParticipants}
                        onChange={(event) =>
                          updateTier(index, "maxParticipants", Number(event.target.value || 0))
                        }
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                        Price (VND)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={tier.pricePerPerson}
                        onChange={(event) =>
                          updateTier(index, "pricePerPerson", Number(event.target.value || 0))
                        }
                        className="w-full px-3 py-2 border border-stone-200 rounded-2xl text-sm text-stone-700 font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Preview + Delete */}
                  <div className="flex items-start gap-2 shrink-0">
                    <div className="hidden sm:block text-right pt-1">
                      <p className="text-xs font-mono text-stone-500">
                        {currencyFormatter.format(tier.pricePerPerson)}
                      </p>
                      <p className="text-xs text-stone-400">VND</p>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeTier(index)}
                      className="w-8 h-8 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500/20 mt-1"
                      aria-label="Remove pricing tier"
                    >
                      <Trash className="w-4 h-4" weight="regular" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 mt-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200/60"
        >
          {validationError}
        </motion.p>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onSave}
          disabled={saving || Boolean(validationError)}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-[0_4px_16px_-4px_rgba(245,158,11,0.4)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {saving && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saveLabel}
        </motion.button>

        {allowClear && onClear && (
          <motion.button
            type="button"
            onClick={onClear}
            disabled={clearing}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-800 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500/20"
          >
            {clearing && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {clearLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
