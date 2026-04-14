import ProviderTourApprovals from "@/features/dashboard/components/ProviderTourApprovals";

export const metadata = {
  title: "Phê duyệt Tour - Transport Provider",
};

export default function TransportTourApprovalsPage() {
  return <ProviderTourApprovals providerType="transport" />;
}
