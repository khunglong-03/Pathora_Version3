import { DepositPoliciesPage } from "@/features/dashboard/components/DepositPoliciesPage";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";

export default function DepositPoliciesRoutePage() {
  return (
    <TourRequestAdminLayout
      title="Deposit Policies"
      subtitle="Manage deposit requirements for tour bookings"
    >
      <DepositPoliciesPage />
    </TourRequestAdminLayout>
  );
}
