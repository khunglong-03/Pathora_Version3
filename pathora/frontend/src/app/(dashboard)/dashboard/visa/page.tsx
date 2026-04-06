import dynamic from "next/dynamic";

const VisaApplicationsPage = dynamic(
  () => import("@/features/dashboard/components/VisaApplicationsPage"),
);

export default function DashboardVisaPage() {
  return <VisaApplicationsPage />;
}
