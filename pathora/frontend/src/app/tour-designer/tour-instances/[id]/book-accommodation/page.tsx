import React from "react";
import { TourDesignerBookAccommodation } from "@/features/tour-designer/components/TourDesignerBookAccommodation";

export default function BookAccommodationPage({ params }: { params: { id: string } }) {
  return <TourDesignerBookAccommodation instanceId={params.id || "INST-001"} />;
}
