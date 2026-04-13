import type { Metadata } from "next";
import { TourDesignerLayout } from "@/features/tour-designer/components/TourDesignerLayout";
import { TourFormPage } from "@/features/tour-designer/components/TourFormPage";

export const metadata: Metadata = {
  title: "Create Tour | Tour Designer",
};

export default function CreateTourPage() {
  return (
    <TourDesignerLayout>
      <TourFormPage mode="create" showPolicySections={false} />
    </TourDesignerLayout>
  );
}