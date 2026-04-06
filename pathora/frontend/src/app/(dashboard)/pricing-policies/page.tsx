import { PricingPoliciesPage } from "@/features/dashboard/components/PricingPoliciesPage";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";

export default function PricingPoliciesRoutePage() {
  return (
    <TourRequestAdminLayout
      title="Pricing Policies"
      subtitle="Manage age-based pricing rules for tours"
    >
      <PricingPoliciesPage />
    </TourRequestAdminLayout>
  );
}
