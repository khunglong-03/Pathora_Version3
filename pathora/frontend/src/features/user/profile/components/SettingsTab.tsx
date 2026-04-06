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
const CSS = {
  accent:       "var(--accent)",
  accentMuted:  "var(--accent-muted)",
  border:       "var(--border)",
  borderSub:    "var(--border-subtle)",
  surface:      "var(--surface)",
  textPrimary:  "var(--text-primary)",
  textSecondary:"var(--text-secondary)",
  textMuted:    "var(--text-muted)",
  success:      "var(--success)",
  shadowCard:   "var(--shadow-card)",
} as const;

interface SettingsTabProps {
  user: UserInfo | null;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-lg" style={{ backgroundColor: CSS.borderSub }} />
      <div className="h-16 rounded-lg" style={{ backgroundColor: CSS.borderSub }} />
      <div className="h-16 rounded-lg" style={{ backgroundColor: CSS.borderSub }} />
      <div className="h-16 rounded-lg" style={{ backgroundColor: CSS.borderSub }} />
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
        className="rounded-lg border p-6 text-center space-y-3"
        style={{ borderColor: CSS.border, backgroundColor: CSS.surface, boxShadow: CSS.shadowCard }}
      >
        <h3 style={{ color: CSS.textPrimary }} className="text-base font-semibold">
          {t("common.profilePage.settingsTitle") || "Cài đặt"}
        </h3>
        <p style={{ color: CSS.textSecondary }} className="text-sm">
          {t("common.profilePage.notificationPreferences.comingSoon") || "Cài đặt sẽ sớm khả dụng."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ borderColor: CSS.border, color: CSS.textSecondary }}
          className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 transition-colors"
        >
          {t("common.retry") || "Thử lại"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <h2 style={{ color: CSS.textPrimary }} className="text-lg font-semibold">
          {t("common.profilePage.settingsTitle") || "Cài đặt"}
        </h2>
        <p style={{ color: CSS.textSecondary }} className="text-sm mt-1">
          {t("common.profilePage.settingsSubtitle") || "Tùy chỉnh thông báo và tùy chọn cá nhân"}
        </p>
      </div>

      {/* Language preference — segmented EN/VI control at the top */}
      <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <div>
          <h3 style={{ color: CSS.textPrimary }} className="font-medium">
            {t("common.settingsPage.languagePreference") || "Ngôn ngữ / Language"}
          </h3>
          <p style={{ color: CSS.textSecondary }} className="text-sm">
            {t("common.settingsPage.languagePreferenceDesc") || "Chọn ngôn ngữ hiển thị"}
          </p>
        </div>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: CSS.border }}
        >
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleLanguageChange("en")}
            style={{
              backgroundColor: localSettings.preferredLanguage === "en" ? CSS.accent : "transparent",
              color: localSettings.preferredLanguage === "en" ? "#fff" : CSS.textSecondary,
            }}
            className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            EN
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleLanguageChange("vi")}
            style={{
              backgroundColor: localSettings.preferredLanguage === "vi" ? CSS.accent : "transparent",
              color: localSettings.preferredLanguage === "vi" ? "#fff" : CSS.textSecondary,
            }}
            className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 border-l"
            data-testid="lang-vi"
          >
            VI
          </button>
        </div>
      </div>

      {/* Email notifications */}
      <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <div>
          <h3 style={{ color: CSS.textPrimary }} className="font-medium">{t("common.settingsPage.emailNotifications") || "Thông báo qua email"}</h3>
          <p style={{ color: CSS.textSecondary }} className="text-sm">{t("common.settingsPage.emailNotificationsDesc") || "Nhận thông báo qua email"}</p>
        </div>
        <ToggleSwitch
          enabled={localSettings.notificationEmail}
          disabled={isUpdating}
          onChange={() => void saveSettings({ ...localSettings, notificationEmail: !localSettings.notificationEmail })}
          aria-label={t("common.settingsPage.emailNotifications") || "Email notifications"}
        />
      </div>

      {/* SMS notifications */}
      <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <div>
          <h3 style={{ color: CSS.textPrimary }} className="font-medium">{t("common.settingsPage.smsNotifications") || "Thông báo qua SMS"}</h3>
          <p style={{ color: CSS.textSecondary }} className="text-sm">{t("common.settingsPage.smsNotificationsDesc") || "Nhận thông báo qua SMS"}</p>
          {!canUseSms && (
            <p style={{ color: CSS.accent }} className="text-xs mt-1">
              {t("common.profilePage.avatar.smsDisabled") || "Add a phone number to enable SMS"}
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
