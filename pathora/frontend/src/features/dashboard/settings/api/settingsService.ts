import { api } from "@/api/axiosInstance";
import { showErrorToast } from "@/api/showErrorToast";
import type {
  OrganizationSettings,
  NotificationPreference,
  PasswordChangePayload,
  ActiveSession,
  TeamMember,
  TeamInvitePayload,
  Integration,
} from "../types";
import {
  MOCK_ORGANIZATION,
  MOCK_NOTIFICATION_PREFERENCES,
  MOCK_TEAM_MEMBERS,
  MOCK_INTEGRATIONS,
} from "../data/mockData";

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SETTINGS_ENDPOINTS = {
  NOTIFICATIONS: "/api/settings/notifications",
  SECURITY_PASSWORD: "/api/settings/security/password",
  SECURITY_2FA_ENABLE: "/api/settings/security/2fa/enable",
  SECURITY_SESSIONS: "/api/settings/security/sessions",
  INTEGRATIONS: "/api/settings/integrations",
  INTEGRATIONS_CONNECT: (id: string) => `/api/settings/integrations/${id}/connect`,
  INTEGRATIONS_DISCONNECT: (id: string) => `/api/settings/integrations/${id}/disconnect`,
} as const;

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeResponse = error as { response?: { status?: number } };
  return maybeResponse.response?.status === 404;
};

const withMockFallback = async <T>(
  request: () => Promise<T>,
  fallback: T,
  fallbackReason: string,
): Promise<ServiceResponse<T>> => {
  try {
    const data = await request();
    return { success: true, data };
  } catch (error) {
    if (isNotFoundError(error)) {
      // TODO: remove fallback when backend settings endpoints are implemented
      console.warn(`[settingsService] ${fallbackReason}. Falling back to mock data.`);
      return { success: true, data: fallback };
    }

    showErrorToast("DEFAULT_ERROR");
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
};

export const settingsService = {
  // ============ Organization ============
  getOrganizationSettings: async (): Promise<ServiceResponse<OrganizationSettings>> => {
    return { success: true, data: MOCK_ORGANIZATION };
  },

  updateOrganizationSettings: async (
    payload: OrganizationSettings,
  ): Promise<ServiceResponse<OrganizationSettings>> => {
    return { success: true, data: payload };
  },

  // ============ Notifications ============
  getNotificationPreferences: async (): Promise<ServiceResponse<NotificationPreference[]>> => {
    return withMockFallback(
      async () => {
        const response = await api.get(SETTINGS_ENDPOINTS.NOTIFICATIONS);
        return (response.data as { result?: NotificationPreference[] }).result ?? MOCK_NOTIFICATION_PREFERENCES;
      },
      MOCK_NOTIFICATION_PREFERENCES,
      "Notifications endpoint not available",
    );
  },

  updateNotificationPreferences: async (
    preferences: NotificationPreference[],
  ): Promise<ServiceResponse<NotificationPreference[]>> => {
    return withMockFallback(
      async () => {
        const response = await api.put(SETTINGS_ENDPOINTS.NOTIFICATIONS, { preferences });
        return (response.data as { result?: NotificationPreference[] }).result ?? preferences;
      },
      preferences,
      "Notifications update endpoint not available",
    );
  },

  // ============ Security ============
  changePassword: async (
    payload: PasswordChangePayload,
  ): Promise<ServiceResponse<null>> => {
    return withMockFallback(
      async () => {
        await api.post(SETTINGS_ENDPOINTS.SECURITY_PASSWORD, payload);
        return null;
      },
      null,
      "Security password endpoint not available",
    );
  },

  enableTwoFactor: async (): Promise<ServiceResponse<null>> => {
    return withMockFallback(
      async () => {
        await api.post(SETTINGS_ENDPOINTS.SECURITY_2FA_ENABLE);
        return null;
      },
      null,
      "2FA endpoint not available",
    );
  },

  getActiveSessions: async (): Promise<ServiceResponse<ActiveSession[]>> => {
    return withMockFallback(
      async () => {
        const response = await api.get(SETTINGS_ENDPOINTS.SECURITY_SESSIONS);
        return (response.data as { result?: ActiveSession[] }).result ?? [];
      },
      [
        {
          id: "current",
          device: "Windows",
          browser: "Chrome",
          location: "Ho Chi Minh City",
          lastActive: "Now",
          isCurrent: true,
        },
      ],
      "Security sessions endpoint not available",
    );
  },

  // ============ Team ============
  getTeamMembers: async (): Promise<ServiceResponse<TeamMember[]>> => {
    return { success: true, data: MOCK_TEAM_MEMBERS };
  },

  inviteTeamMember: async (
    payload: TeamInvitePayload,
  ): Promise<ServiceResponse<TeamMember>> => {
    const pendingMember: TeamMember = {
      id: `pending-${Date.now()}`,
      name: payload.email.split("@")[0] || "Pending User",
      email: payload.email,
      role: payload.role,
      status: "pending",
    };

    return { success: true, data: pendingMember };
  },

  // ============ Integrations ============
  getIntegrations: async (): Promise<ServiceResponse<Integration[]>> => {
    return withMockFallback(
      async () => {
        const response = await api.get(SETTINGS_ENDPOINTS.INTEGRATIONS);
        return (response.data as { result?: Integration[] }).result ?? MOCK_INTEGRATIONS;
      },
      MOCK_INTEGRATIONS,
      "Integrations endpoint not available",
    );
  },

  connectIntegration: async (integrationId: string): Promise<ServiceResponse<null>> => {
    return withMockFallback(
      async () => {
        await api.post(SETTINGS_ENDPOINTS.INTEGRATIONS_CONNECT(integrationId));
        return null;
      },
      null,
      "Integration connect endpoint not available",
    );
  },

  disconnectIntegration: async (integrationId: string): Promise<ServiceResponse<null>> => {
    return withMockFallback(
      async () => {
        await api.post(SETTINGS_ENDPOINTS.INTEGRATIONS_DISCONNECT(integrationId));
        return null;
      },
      null,
      "Integration disconnect endpoint not available",
    );
  },
};
