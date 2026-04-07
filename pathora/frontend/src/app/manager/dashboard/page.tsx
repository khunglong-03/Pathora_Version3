import type { Metadata } from "next";
import { AdminDashboardPage } from "@/features/dashboard/components/AdminDashboardPage";

export const metadata: Metadata = {
  title: "Admin Dashboard | Pathora",
  description: "Pathora Admin Dashboard - Manage tours, bookings, customers, and more.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <AdminDashboardPage />;
}
