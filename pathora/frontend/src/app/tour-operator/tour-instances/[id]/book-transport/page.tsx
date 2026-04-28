import React from "react";
import { TourOperatorBookTransport } from "@/features/tour-operator/components/TourOperatorBookTransport";

export default function BookTransportPage({ params }: { params: { id: string } }) {
  return <TourOperatorBookTransport instanceId={params.id || "INST-001"} />;
}
