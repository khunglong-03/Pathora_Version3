import type { Metadata } from "next";

import { TourFormPage } from "@/features/tour-operator/components/TourFormPage";

export const metadata: Metadata = {
  title: "Create Tour | Tour Operator",
};

export default function CreateTourPage() {
  return (
    <TourFormPage mode="create" showPolicySections={false} />
  );
}