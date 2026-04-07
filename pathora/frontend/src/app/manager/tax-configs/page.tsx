import { TaxConfigsPage } from "@/features/dashboard/components/TaxConfigsPage";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";

export default function TaxConfigsRoutePage() {
  return (
    <TourRequestAdminLayout
      title="Tax Configuration"
      subtitle="Manage tax rates for tour pricing"
    >
      <TaxConfigsPage />
    </TourRequestAdminLayout>
  );
}
