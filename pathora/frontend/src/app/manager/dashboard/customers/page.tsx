import dynamic from "next/dynamic";

const StaffTrackingPage = dynamic(
  () => import("@/features/dashboard/components/StaffTrackingPage"),
);

export default function DashboardStaffPage() {
  return <StaffTrackingPage />;
}
