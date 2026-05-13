"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { UserInfo } from "@/store/domain/auth";
import { handleApiError } from "@/utils/apiResponse";
import { useUserSettings } from "../hooks/useProfile";
import type { UserSettings } from "../types";
import { ToggleSwitch } from "@/features/dashboard/settings/components/ToggleSwitch";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Using Tailwind directly to match the-hieu-design.md

interface SettingsTabProps {
  user: UserInfo | null;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
    </div>
  );
}

export function SettingsTab({ user }: SettingsTabProps) {
  const { t, i18n } = useTranslation();
  const {
    settings,
    isLoading,
    isUnavailable,
    isUpdating,
    updateSettings,
    refetch,
  } = useUserSettings();

  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  // Sync local state when settings load
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Sync i18n when preferredLanguage changes from server
  useEffect(() => {
    if (i18n.isInitialized && localSettings.preferredLanguage) {
      if (i18n.language !== localSettings.preferredLanguage) {
        i18n.changeLanguage(localSettings.preferredLanguage);
      }
    } else if (!i18n.isInitialized) {
      // Defer until initialized
      const handleInit = () => {
        if (localSettings.preferredLanguage && i18n.language !== localSettings.preferredLanguage) {
          i18n.changeLanguage(localSettings.preferredLanguage);
        }
      };
      if (i18n.isInitialized) {
        handleInit();
      } else {
        i18n.on("initialized", handleInit);
        return () => { i18n.off("initialized", handleInit); };
      }
    }
  }, [localSettings.preferredLanguage, i18n]);

  const canUseSms = useMemo(() => Boolean(user?.phoneNumber), [user?.phoneNumber]);

  const saveSettings = async (next: UserSettings) => {
    const previous = localSettings;
    setLocalSettings(next);

    try {
      await updateSettings({
        preferredLanguage: next.preferredLanguage,
        notificationEmail: next.notificationEmail,
        notificationSms: next.notificationSms,
        notificationPush: next.notificationPush,
        theme: next.theme,
      }).unwrap();

      // Sync i18n on language change
      if (next.preferredLanguage !== previous.preferredLanguage) {
        i18n.changeLanguage(next.preferredLanguage);
        toast.success(t("common.settingsPage.languageChanged") || "Ngôn ngữ đã được thay đổi.");
      }
    } catch (error) {
      setLocalSettings(previous);
      const apiError = handleApiError(error);
      toast.error(apiError.message || t("common.profilePage.updateFailed") || "Cập nhật thất bại");
    }
  };

  const handleLanguageChange = (lang: string) => {
    void saveSettings({ ...localSettings, preferredLanguage: lang });
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isUnavailable) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-3 shadow-sm"
      >
        <h3 className="text-base font-semibold text-slate-900">
          {t("common.profilePage.settingsTitle") || "Cài đặt"}
        </h3>
        <p className="text-sm text-slate-500">
          {t("common.profilePage.notificationPreferences.comingSoon") || "Cài đặt sẽ sớm khả dụng."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {t("common.retry") || "Thử lại"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {t("common.profilePage.settingsTitle") || "Cài đặt"}
        </h2>
        <p className="text-sm mt-1 text-slate-500">
          {t("common.profilePage.settingsSubtitle") || "Tùy chỉnh thông báo và tùy chọn cá nhân"}
        </p>
      </div>

      {/* Language preference — segmented EN/VI control at the top */}
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-700 mb-1">
            {t("common.settingsPage.languagePreference") || "Ngôn ngữ / Language"}
          </h3>
          <p className="text-sm text-slate-500">
            {t("common.settingsPage.languagePreferenceDesc") || "Chọn ngôn ngữ hiển thị"}
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleLanguageChange("en")}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              localSettings.preferredLanguage === "en"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleLanguageChange("vi")}
            className={`px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 border-l border-slate-200 ${
              localSettings.preferredLanguage === "vi"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
            data-testid="lang-vi"
          >
            VI
          </button>
        </div>
      </div>

      {/* Email notifications */}
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-700 mb-1">{t("common.settingsPage.emailNotifications") || "Thông báo qua email"}</h3>
          <p className="text-sm text-slate-500">{t("common.settingsPage.emailNotificationsDesc") || "Nhận thông báo qua email"}</p>
        </div>
        <ToggleSwitch
          enabled={localSettings.notificationEmail}
          disabled={isUpdating}
          onChange={() => void saveSettings({ ...localSettings, notificationEmail: !localSettings.notificationEmail })}
          aria-label={t("common.settingsPage.emailNotifications") || "Email notifications"}
        />
      </div>

      {/* SMS notifications */}
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-700 mb-1">{t("common.settingsPage.smsNotifications") || "Thông báo qua SMS"}</h3>
          <p className="text-sm text-slate-500">{t("common.settingsPage.smsNotificationsDesc") || "Nhận thông báo qua SMS"}</p>
          {!canUseSms && (
            <p className="text-xs mt-1.5 font-medium text-orange-600">
              {t("common.profilePage.avatar.smsDisabled") || "Thêm số điện thoại để nhận SMS"}
            </p>
          )}
        </div>
        <ToggleSwitch
          enabled={localSettings.notificationSms}
          disabled={isUpdating || !canUseSms}
          onChange={() => void saveSettings({ ...localSettings, notificationSms: !localSettings.notificationSms })}
          aria-label={t("common.settingsPage.smsNotifications") || "SMS notifications"}
        />
      </div>
    </div>
  );
}
