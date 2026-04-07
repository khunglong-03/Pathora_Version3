import dynamic from "next/dynamic";

const PaymentsPage = dynamic(
  () => import("@/features/dashboard/components/PaymentsPage"),
);

export default function DashboardPaymentsPage() {
  return <PaymentsPage />;
}
