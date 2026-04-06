import dynamic from "next/dynamic";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";

const SiteContentManagementPage = dynamic(
  () => import("@/features/dashboard/components/SiteContentManagementPage"),
);

export default function DashboardSiteContentPage() {
  return (
    <TourRequestAdminLayout
      title="Site Content"
      subtitle="Manage page content records and edit English/Vietnamese JSON values"
    >
      <SiteContentManagementPage />
    </TourRequestAdminLayout>
  );
}
