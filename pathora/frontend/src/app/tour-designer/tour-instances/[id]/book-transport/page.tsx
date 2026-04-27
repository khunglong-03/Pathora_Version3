import React from "react";
import { TourDesignerBookTransport } from "@/features/tour-designer/components/TourDesignerBookTransport";

export default function BookTransportPage({ params }: { params: { id: string } }) {
  return <TourDesignerBookTransport instanceId={params.id || "INST-001"} />;
}
