import React from "react";
import { TourDesignerAssignServices } from "@/features/tour-designer/components/TourDesignerAssignServices";

export default function AssignServicesPage({ params }: { params: { id: string } }) {
  return <TourDesignerAssignServices instanceId={params.id || "INST-001"} />;
}
