import React from "react";
import { TourOperatorAssignServices } from "@/features/tour-operator/components/TourOperatorAssignServices";

export default async function AssignServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourOperatorAssignServices instanceId={resolvedParams.id || "INST-001"} />;
}
