import React from "react";
import { TourOperatorAssignServices } from "@/features/tour-operator/components/TourOperatorAssignServices";

export default function AssignServicesPage({ params }: { params: { id: string } }) {
  return <TourOperatorAssignServices instanceId={params.id || "INST-001"} />;
}
