import type { Metadata } from "next";
import { CustomTourInstanceRequestListPage } from "@/features/dashboard/components/CustomTourInstanceRequestListPage";

export const metadata: Metadata = {
  title: "Custom Tour Requests | Tour Operator | Pathora",
  description: "Review and manage custom tour instance requests assigned to you.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/tour-operator/custom-tour-requests",
  },
};

export default function TourOperatorCustomTourRequestsPage() {
  return <CustomTourInstanceRequestListPage role="tour-operator" />;
}
