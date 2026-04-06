"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { toastConfig } from "@/api/axiosInstance";
import { SectionCard } from "../components/SectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { SettingsTabSkeleton } from "../components/SettingsTabSkeleton";
import { useOrganizationSettings } from "../hooks/useSettings";
import type { OrganizationSettings } from "../types";

const EMPTY_FORM: OrganizationSettings = {
  companyName: "",
  businessEmail: "",
  timezone: "Asia/Ho_Chi_Minh (GMT+7)",
  currency: "USD ($)",
};

export function GeneralTab() {
  const { t } = useTranslation();
  const { data, isLoading, isSaving, save } = useOrganizationSettings();

  const [form, setForm] = useState<OrganizationSettings>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationSettings, string>>>({});
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(data);
    }
  }, [data]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof OrganizationSettings, string>> = {};

    if (!form.companyName.trim()) {
      nextErrors.companyName = "Company name is required";
    }

    if (!form.businessEmail.trim()) {
      nextErrors.businessEmail = "Business email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.businessEmail)) {
      nextErrors.businessEmail = "Please enter a valid email";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSavedState("saving");
    const response = await save(form);

    if (!response.success) {
      setSavedState("idle");
      toast.error(response.error ?? "Failed to save settings", toastConfig);
      return;
    }

    setSavedState("saved");
    toast.success("Settings saved successfully", toastConfig);
    window.setTimeout(() => setSavedState("idle"), 2000);
  };

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  return (
    <SectionCard>
      <SectionHeader title={t("settings.general.organization")} subtitle="Company profile" />

      <div className="px-8 py-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-stone-700">{t("settings.general.companyName")}</label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm text-stone-700 transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {errors.companyName ? <p className="text-xs text-red-600">{errors.companyName}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-stone-700">{t("settings.general.businessEmail")}</label>
          <input
            type="email"
            value={form.businessEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, businessEmail: e.target.value }))}
            className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm text-stone-700 transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {errors.businessEmail ? <p className="text-xs text-red-600">{errors.businessEmail}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">{t("settings.general.timezone")}</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm text-stone-700 transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option>Asia/Ho_Chi_Minh (GMT+7)</option>
              <option>Asia/Tokyo (GMT+9)</option>
              <option>Asia/Seoul (GMT+9)</option>
              <option>UTC (GMT+0)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">{t("settings.general.currency")}</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm text-stone-700 transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option>USD ($)</option>
              <option>VND</option>
              <option>EUR</option>
              <option>JPY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-8 pb-6 pt-4 border-t border-border flex items-center gap-3">
        <Button
          disabled={isSaving}
          onClick={handleSave}
          className="bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {savedState === "saving"
            ? "Saving..."
            : savedState === "saved"
              ? "✓ Saved"
              : t("settings.general.saveChanges")}
        </Button>
      </div>
    </SectionCard>
  );
}

export default GeneralTab;
