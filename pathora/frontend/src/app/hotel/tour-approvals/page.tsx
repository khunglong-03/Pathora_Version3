import ProviderTourApprovals from "@/features/dashboard/components/ProviderTourApprovals";

export const metadata = {
  title: "Phê duyệt Tour - Hotel Provider",
};

export default function HotelTourApprovalsPage() {
  return <ProviderTourApprovals providerType="hotel" />;
}
