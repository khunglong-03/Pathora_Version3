// Settings types — API contracts and domain models

// ============ Organization ============
export interface OrganizationSettings {
  companyName: string;
  businessEmail: string;
  timezone: string;
  currency: string;
}

// ============ Notifications ============
export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface NotificationSettings {
  preferences: NotificationPreference[];
}

// ============ Security ============
export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessions: ActiveSession[];
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
}

// ============ Billing ============
export interface BillingUsageMetric {
  label: string;
  labelKey: string; // i18n key
  current: string;
  max: string;
  percent: string;
}

export interface BillingSettings {
  planName: string;
  planNameKey: string; // i18n key
  renewsOn: string;
  renewsOnKey: string; // i18n key
  price: string;
  usageMetrics: BillingUsageMetric[];
}

// ============ Team ============
export type TeamRole = "Owner" | "Admin" | "Editor" | "Viewer";
export type TeamMemberStatus = "active" | "pending";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
}

export interface TeamInvitePayload {
  email: string;
  role: TeamRole;
}

// ============ Integrations ============
export type IntegrationStatus = "connected" | "disconnected";

export interface Integration {
  id: string;
  nameKey: string; // i18n key
  descKey: string; // i18n key
  iconName: string; // Phosphor icon component name
  connected: boolean;
}

export interface IntegrationSettings {
  integrations: Integration[];
}

// ============ Settings API Response ============
export interface SettingsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
