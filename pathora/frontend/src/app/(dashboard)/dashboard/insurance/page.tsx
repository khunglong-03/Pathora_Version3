import dynamic from "next/dynamic";

const InsurancePage = dynamic(
  () => import("@/features/dashboard/components/InsurancePage"),
);

export default function DashboardInsurancePage() {
  return <InsurancePage />;
}
