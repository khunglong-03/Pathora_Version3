import React from "react";
import { TourOperatorBookTransport } from "@/features/tour-operator/components/TourOperatorBookTransport";

export default async function BookTransportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourOperatorBookTransport instanceId={resolvedParams.id || "INST-001"} />;
}
