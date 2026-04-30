import { TourInstanceListPage } from "@/features/dashboard/components/TourInstanceListPage";

export const metadata = {
  title: "Tour Riêng Tư | Tour Operator",
  description: "Danh sách các tour riêng tư cần đăng ký xe và khách sạn cho khách",
};

export default function TourOperatorPrivateInstancesPage() {
  return <TourInstanceListPage role="tour-operator" instanceTypeFilter="private" />;
}
