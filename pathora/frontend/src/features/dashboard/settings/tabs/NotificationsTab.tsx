"use client";

import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { toastConfig } from "@/api/axiosInstance";
import { SectionCard } from "../components/SectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { useNotificationSettings } from "../hooks/useSettings";

export function NotificationsTab() {
  const { t } = useTranslation();
  const { preferences, isLoading, updatePreference } = useNotificationSettings();

  const handleToggle = async (id: string, enabled: boolean) => {
    const response = await updatePreference(id, enabled);
    if (!response.success) {
      toast.error(response.error ?? "Failed to update preference", toastConfig);
      return;
    }

    toast.success("Notification preference updated", toastConfig);
  };

  return (
    <SectionCard>
      <SectionHeader title={t("settings.notifications.title")} subtitle="Preferences" />

      {isLoading ? (
        <div className="px-8 py-8 text-sm text-stone-500">Loading notification preferences...</div>
      ) : preferences.length === 0 ? (
        <div className="px-8 py-8 text-center">
          <p className="text-sm font-medium text-stone-700">No notification preferences configured</p>
          <p className="text-xs text-stone-500 mt-1">Notification options will appear here once available.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {preferences.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-8 py-4">
              <div>
                <p className="text-sm font-medium text-stone-900">{t(item.label)}</p>
                <p className="text-xs text-stone-500 mt-0.5">{t(item.description)}</p>
              </div>
              <ToggleSwitch
                enabled={item.enabled}
                onChange={() => {
                  void handleToggle(item.id, !item.enabled);
                }}
                aria-label={t(item.label)}
              />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default NotificationsTab;
