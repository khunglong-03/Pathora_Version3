import React from "react";
import { TourOperatorBookAccommodation } from "@/features/tour-operator/components/TourOperatorBookAccommodation";

export default async function BookAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourOperatorBookAccommodation instanceId={resolvedParams.id || "INST-001"} />;
}
