import type { Metadata } from "next";
import { TourRequestListPage } from "@/features/dashboard/components/TourRequestListPage";

export const metadata: Metadata = {
  title: "Tour Requests | Pathora",
  description: "Review and manage customer tour requests in Pathora admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardTourRequestsPage() {
  return <TourRequestListPage />;
}
