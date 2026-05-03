import React from "react";
import { TourOperatorAssignServices } from "@/features/tour-operator/components/TourDesignerAssignServices";

export default function PrivateAssignServicesPage({ params }: { params: { id: string } }) {
  return <TourOperatorAssignServices instanceId={params.id} backUrl={`/tour-operator/tour-instances/private/${params.id}`} />;
}
