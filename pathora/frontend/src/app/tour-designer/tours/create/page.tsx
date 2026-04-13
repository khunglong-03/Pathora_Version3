import type { Metadata } from "next";

import { TourFormPage } from "@/features/tour-designer/components/TourFormPage";

export const metadata: Metadata = {
  title: "Create Tour | Tour Designer",
};

export default function CreateTourPage() {
  return (
    <TourFormPage mode="create" showPolicySections={false} />
  );
}