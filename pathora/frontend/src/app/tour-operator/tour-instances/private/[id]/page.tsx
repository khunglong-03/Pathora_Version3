import type { Metadata } from "next";
import PrivateTourInstanceDetailPage from "@/features/dashboard/components/PrivateTourInstanceDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết Tour Riêng Tư | Tour Operator",
  description: "Xem trạng thái duyệt và lịch trình tour riêng tư",
  robots: { index: false, follow: false },
};

export default function TourOperatorPrivateTourDetailRoute() {
  return <PrivateTourInstanceDetailPage />;
}
