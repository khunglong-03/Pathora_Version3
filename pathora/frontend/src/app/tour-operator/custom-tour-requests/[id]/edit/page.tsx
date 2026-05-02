import type { Metadata } from "next";
import PrivateTourInstanceEditPage from "@/features/dashboard/components/PrivateTourInstanceEditPage";

export const metadata: Metadata = {
  title: "Chỉnh sửa Custom Tour Request | Tour Operator",
  description: "Chỉnh sửa thông tin yêu cầu tuỳ chỉnh tour và gửi cho Manager duyệt",
  robots: { index: false, follow: false },
};

export default function CustomTourRequestEditRoute() {
  return <PrivateTourInstanceEditPage />;
}
