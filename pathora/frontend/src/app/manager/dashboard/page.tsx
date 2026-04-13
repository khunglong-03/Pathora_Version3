import type { Metadata } from "next";
import { ManagerDashboardPage } from "@/features/dashboard/components/ManagerDashboardPage";

export const metadata: Metadata = {
  title: "Manager Dashboard | Pathora",
  description: "Pathora Manager Dashboard - Overview of tours, bookings, staff and more.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/manager/dashboard",
  },
};

export default function DashboardPage() {
  return <ManagerDashboardPage />;
}
