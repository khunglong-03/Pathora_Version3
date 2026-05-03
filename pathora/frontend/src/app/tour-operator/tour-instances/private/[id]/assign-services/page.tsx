import React from "react";
import { TourOperatorAssignServices } from "@/features/tour-operator/components/TourDesignerAssignServices";

export default async function PrivateAssignServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourOperatorAssignServices instanceId={resolvedParams.id} backUrl={`/tour-operator/tour-instances/private/${resolvedParams.id}`} />;
}
