"use client";

import { useMemo } from "react";
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "@/store/api/auth/authApiSlice";
import type { NotificationPreferences, UserSettings } from "../types";
import { DEFAULT_USER_SETTINGS } from "../types";
import { extractResult } from "@/utils/apiResponse";

const isNotImplementedStatus = (status?: number): boolean => status === 404 || status === 501;

export function useNotificationPreferences() {
  const query = useGetUserSettingsQuery();
  const [updatePreferences, updateState] = useUpdateUserSettingsMutation();

  const settings = useMemo<UserSettings>(() => {
    const extracted = extractResult<UserSettings>(query.data);
    return extracted ?? DEFAULT_USER_SETTINGS;
  }, [query.data]);

  // Derive NotificationPreferences from settings (for backward compat with SettingsTab)
  const preferences = useMemo<NotificationPreferences>(() => ({
    emailNotifications: settings.notificationEmail,
    smsNotifications: settings.notificationSms,
    newsletter: true, // newsletter not in UserSettingEntity — default to true
  }), [settings]);

  const status = typeof query.error === "object" && query.error && "status" in query.error
    ? Number((query.error as { status?: number | string }).status)
    : undefined;

  return {
    preferences,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isUnavailable: isNotImplementedStatus(status),
    error: query.error,
    refetch: query.refetch,
    updatePreferences,
    isUpdating: updateState.isLoading,
  };
}

export function useUserSettings() {
  const query = useGetUserSettingsQuery();
  const [updateSettings, updateState] = useUpdateUserSettingsMutation();

  const settings = useMemo<UserSettings>(() => {
    const extracted = extractResult<UserSettings>(query.data);
    return extracted ?? DEFAULT_USER_SETTINGS;
  }, [query.data]);

  const status = typeof query.error === "object" && query.error && "status" in query.error
    ? Number((query.error as { status?: number | string }).status)
    : undefined;

  return {
    settings,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isUnavailable: isNotImplementedStatus(status),
    error: query.error,
    refetch: query.refetch,
    updateSettings,
    isUpdating: updateState.isLoading,
  };
}
