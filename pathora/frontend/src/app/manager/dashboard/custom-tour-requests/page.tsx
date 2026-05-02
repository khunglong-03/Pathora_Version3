import type { Metadata } from "next";
import { CustomTourInstanceRequestListPage } from "@/features/dashboard/components/CustomTourInstanceRequestListPage";

export const metadata: Metadata = {
  title: "Custom Tour Requests | Pathora",
  description: "Review and manage custom tour instance requests in Pathora admin.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/manager/dashboard/custom-tour-requests",
  },
};

export default function DashboardCustomTourRequestsPage() {
  return <CustomTourInstanceRequestListPage role="manager" />;
}
