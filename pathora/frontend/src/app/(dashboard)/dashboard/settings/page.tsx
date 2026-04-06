import dynamic from "next/dynamic";

const SettingsPage = dynamic(
  () => import("@/features/dashboard/settings/SettingsPage"),
);

export default function DashboardSettingsPage() {
  return <SettingsPage />;
}
