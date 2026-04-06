import type {
  OrganizationSettings,
  NotificationPreference,
  TeamMember,
  Integration,
} from "../types";

// ============ Organization ============
export const MOCK_ORGANIZATION: OrganizationSettings = {
  companyName: "Pathora",
  businessEmail: "contact@pathora.com",
  timezone: "Asia/Ho_Chi_Minh (GMT+7)",
  currency: "USD ($)",
};

// ============ Notifications ============
export const MOCK_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    id: "email-bookings",
    label: "settings.notifications.emailBookings",
    description: "settings.notifications.emailBookingsDesc",
    enabled: true,
  },
  {
    id: "payment-reminders",
    label: "settings.notifications.paymentReminders",
    description: "settings.notifications.paymentRemindersDesc",
    enabled: true,
  },
  {
    id: "visa-updates",
    label: "settings.notifications.visaUpdates",
    description: "settings.notifications.visaUpdatesDesc",
    enabled: true,
  },
  {
    id: "tour-reminders",
    label: "settings.notifications.tourReminders",
    description: "settings.notifications.tourRemindersDesc",
    enabled: false,
  },
  {
    id: "weekly-reports",
    label: "settings.notifications.weeklyReports",
    description: "settings.notifications.weeklyReportsDesc",
    enabled: true,
  },
  {
    id: "marketing",
    label: "settings.notifications.marketing",
    description: "settings.notifications.marketingDesc",
    enabled: false,
  },
];

// ============ Team ============
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "Admin User", email: "admin@pathora.com", role: "Owner", status: "active" },
  { id: "2", name: "Sales Manager", email: "sales@pathora.com", role: "Admin", status: "active" },
  { id: "3", name: "Support Agent", email: "support@pathora.com", role: "Editor", status: "active" },
  { id: "4", name: "Content Writer", email: "content@pathora.com", role: "Viewer", status: "pending" },
];

// ============ Integrations ============
export const MOCK_INTEGRATIONS: Integration[] = [
  { id: "payment-gateway", nameKey: "settings.integrations.paymentGateway", descKey: "settings.integrations.paymentGatewayDesc", iconName: "CreditCard", connected: true },
  { id: "email-service", nameKey: "settings.integrations.emailService", descKey: "settings.integrations.emailServiceDesc", iconName: "FileText", connected: true },
  { id: "sms-notifications", nameKey: "settings.integrations.smsNotifications", descKey: "settings.integrations.smsNotificationsDesc", iconName: "GearSix", connected: false },
  { id: "analytics", nameKey: "settings.integrations.analytics", descKey: "settings.integrations.analyticsDesc", iconName: "Calculator", connected: true },
  { id: "crm-integration", nameKey: "settings.integrations.crmIntegration", descKey: "settings.integrations.crmIntegrationDesc", iconName: "PuzzlePiece", connected: false },
];
