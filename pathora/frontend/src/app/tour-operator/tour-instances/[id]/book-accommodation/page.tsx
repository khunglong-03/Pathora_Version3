import React from "react";
import { TourOperatorBookAccommodation } from "@/features/tour-operator/components/TourOperatorBookAccommodation";

export default function BookAccommodationPage({ params }: { params: { id: string } }) {
  return <TourOperatorBookAccommodation instanceId={params.id || "INST-001"} />;
}
