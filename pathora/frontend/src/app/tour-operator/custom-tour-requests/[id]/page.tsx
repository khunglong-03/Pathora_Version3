import type { Metadata } from "next";
import CustomTourRequestDetailPage from "@/features/dashboard/components/CustomTourRequestDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết yêu cầu Custom Tour | Pathora",
  description: "Xem chi tiết yêu cầu custom tour instance.",
  robots: { index: false, follow: false },
};

export default function TourOperatorCustomTourRequestDetailRoute() {
  return <CustomTourRequestDetailPage role="tour-operator" />;
}
