import type { Metadata } from "next";
import PrivateTourInstanceEditPage from "@/features/dashboard/components/PrivateTourInstanceEditPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa Tour Riêng Tư | Tour Operator",
  description: "Chỉnh sửa thông tin tour riêng tư và gửi cho Manager duyệt",
  robots: { index: false, follow: false },
};

export default function TourOperatorPrivateTourEditRoute() {
  return <PrivateTourInstanceEditPage />;
}
