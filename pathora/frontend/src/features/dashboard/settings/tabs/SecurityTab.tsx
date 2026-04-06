"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { toastConfig } from "@/api/axiosInstance";
import { SectionCard } from "../components/SectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { useSecuritySettings } from "../hooks/useSettings";

export function SecurityTab() {
  const { t } = useTranslation();
  const {
    sessions,
    isLoadingSessions,
    isChangingPassword,
    isEnabling2FA,
    changePassword,
    enableTwoFactor,
  } = useSecuritySettings();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const response = await changePassword({ currentPassword, newPassword });

    if (!response.success) {
      setError(response.error ?? "Failed to change password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully", toastConfig);
  };

  const handleEnable2FA = async () => {
    const confirm = window.confirm("Enable two-factor authentication for this account?");
    if (!confirm) return;

    const response = await enableTwoFactor();
    if (!response.success) {
      toast.error(response.error ?? "Failed to enable 2FA", toastConfig);
      return;
    }

    toast.success("2FA setup initiated", toastConfig);
  };

  return (
    <SectionCard>
      <SectionHeader title={t("settings.security.title")} subtitle="Account security" />
      <div className="px-8 py-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-stone-700 mb-3">{t("settings.security.changePassword")}</h4>
          <div className="space-y-3 max-w-md">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("common.auth.currentPassword")}
              className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("common.auth.newPassword")}
              className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("common.auth.confirmPassword")}
              className="w-full rounded-2xl border border-border bg-stone-50/60 px-4 py-2.5 text-sm transition-all duration-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
          <Button
            disabled={isChangingPassword}
            onClick={handleChangePassword}
            className="mt-4 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isChangingPassword ? "Saving..." : t("settings.security.changePassword")}
          </Button>
        </div>

        <div className="pt-5 border-t border-border">
          <h4 className="text-sm font-semibold text-stone-700 mb-1">{t("settings.security.twoFactor")}</h4>
          <p className="text-xs text-stone-500 mb-3">{t("settings.security.twoFactorDesc")}</p>
          <Button
            disabled={isEnabling2FA}
            onClick={handleEnable2FA}
            className="border border-border text-stone-600 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isEnabling2FA ? "Starting..." : t("settings.security.enable2FA")}
          </Button>
        </div>

        <div className="pt-5 border-t border-border">
          <h4 className="text-sm font-semibold text-stone-700 mb-3">{t("settings.security.activeSessions")}</h4>
          <div className="space-y-2 max-w-md">
            {isLoadingSessions ? (
              <p className="text-xs text-stone-500">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-stone-500">No active sessions</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-stone-50/80 border border-border">
                  <div>
                    <span className="text-sm text-stone-700">{session.browser} on {session.device}</span>
                    <p className="text-xs text-stone-500">{session.location} • {session.lastActive}</p>
                  </div>
                  {session.isCurrent ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {t("settings.security.currentSession")}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default SecurityTab;
