"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsService } from "../api/settingsService";
import type {
  OrganizationSettings,
  NotificationPreference,
  TeamMember,
  TeamInvitePayload,
  PasswordChangePayload,
  Integration,
  ActiveSession,
} from "../types";

export function useOrganizationSettings() {
  const [data, setData] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await settingsService.getOrganizationSettings();
    if (!response.success || !response.data) {
      setError(response.error ?? "Failed to load organization settings");
      setData(null);
    } else {
      setData(response.data);
    }
    setIsLoading(false);
  }, []);

  const save = useCallback(async (payload: OrganizationSettings) => {
    setIsSaving(true);
    const response = await settingsService.updateOrganizationSettings(payload);
    setIsSaving(false);

    if (!response.success || !response.data) {
      return { success: false, error: response.error ?? "Failed to save organization settings" };
    }

    setData(response.data);
    return { success: true };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data, isLoading, isSaving, error, refetch: load, save };
}

export function useNotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await settingsService.getNotificationPreferences();
    if (!response.success || !response.data) {
      setError(response.error ?? "Failed to load notification settings");
      setPreferences([]);
    } else {
      setPreferences(response.data);
    }
    setIsLoading(false);
  }, []);

  const updatePreference = useCallback(async (id: string, enabled: boolean) => {
    const previous = preferences;
    const next = preferences.map((item) => (item.id === id ? { ...item, enabled } : item));

    // optimistic update
    setPreferences(next);
    setIsSaving(true);

    const response = await settingsService.updateNotificationPreferences(next);

    setIsSaving(false);

    if (!response.success || !response.data) {
      // rollback
      setPreferences(previous);
      return { success: false, error: response.error ?? "Failed to update preference" };
    }

    setPreferences(response.data);
    return { success: true };
  }, [preferences]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { preferences, isLoading, isSaving, error, refetch: load, updatePreference };
}

export function useTeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await settingsService.getTeamMembers();
    if (!response.success || !response.data) {
      setError(response.error ?? "Failed to load team members");
      setMembers([]);
    } else {
      setMembers(response.data);
    }
    setIsLoading(false);
  }, []);

  const invite = useCallback(async (payload: TeamInvitePayload) => {
    setIsInviting(true);
    const response = await settingsService.inviteTeamMember(payload);
    setIsInviting(false);

    if (!response.success || !response.data) {
      return { success: false, error: response.error ?? "Failed to invite member" };
    }

    setMembers((prev) => [response.data as TeamMember, ...prev]);
    return { success: true };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { members, isLoading, isInviting, error, refetch: load, invite };
}

export function useSecuritySettings() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    const response = await settingsService.getActiveSessions();
    setIsLoadingSessions(false);

    if (response.success && response.data) {
      setSessions(response.data);
    } else {
      setSessions([]);
    }
  }, []);

  const changePassword = useCallback(async (payload: PasswordChangePayload) => {
    setIsChangingPassword(true);
    const response = await settingsService.changePassword(payload);
    setIsChangingPassword(false);

    if (!response.success) {
      return { success: false, error: response.error ?? "Failed to change password" };
    }

    return { success: true };
  }, []);

  const enableTwoFactor = useCallback(async () => {
    setIsEnabling2FA(true);
    const response = await settingsService.enableTwoFactor();
    setIsEnabling2FA(false);

    if (!response.success) {
      return { success: false, error: response.error ?? "Failed to enable two-factor" };
    }

    return { success: true };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoadingSessions,
    isChangingPassword,
    isEnabling2FA,
    refetchSessions: loadSessions,
    changePassword,
    enableTwoFactor,
  };
}

export function useIntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const response = await settingsService.getIntegrations();
    setIsLoading(false);

    if (response.success && response.data) {
      setIntegrations(response.data);
    } else {
      setIntegrations([]);
    }
  }, []);

  const connect = useCallback(async (id: string) => {
    setIsUpdating(id);
    const response = await settingsService.connectIntegration(id);
    setIsUpdating(null);

    if (!response.success) {
      return { success: false, error: response.error ?? "Failed to connect integration" };
    }

    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connected: true } : item)),
    );

    return { success: true };
  }, []);

  const disconnect = useCallback(async (id: string) => {
    setIsUpdating(id);
    const response = await settingsService.disconnectIntegration(id);
    setIsUpdating(null);

    if (!response.success) {
      return { success: false, error: response.error ?? "Failed to disconnect integration" };
    }

    setIntegrations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, connected: false } : item)),
    );

    return { success: true };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { integrations, isLoading, isUpdating, refetch: load, connect, disconnect };
}
