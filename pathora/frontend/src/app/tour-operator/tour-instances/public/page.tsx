import { TourInstanceListPage } from "@/features/dashboard/components/TourInstanceListPage";

export const metadata = {
  title: "Tour Công Cộng | Tour Operator",
  description: "Danh sách các tour công cộng đã được đăng ký xe, khách sạn",
};

export default function TourOperatorPublicInstancesPage() {
  return <TourInstanceListPage role="tour-operator" instanceTypeFilter="public" />;
}
