import dynamic from "next/dynamic";

const CustomersPage = dynamic(
  () => import("@/features/dashboard/components/CustomersPage"),
);

export default function DashboardCustomersPage() {
  return <CustomersPage />;
}
