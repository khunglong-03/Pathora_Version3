import { VisaPoliciesPage } from "@/features/dashboard/components/VisaPoliciesPage";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";

export default function VisaPoliciesRoutePage() {
  return (
    <TourRequestAdminLayout
      title="Visa Policies"
      subtitle="Manage visa processing time and requirements by region"
    >
      <VisaPoliciesPage />
    </TourRequestAdminLayout>
  );
}
