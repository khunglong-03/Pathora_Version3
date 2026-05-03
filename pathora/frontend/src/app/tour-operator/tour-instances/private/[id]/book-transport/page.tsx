import React from "react";
import { TourOperatorBookTransport } from "@/features/tour-operator/components/TourOperatorBookTransport";

export default async function PrivateBookTransportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourOperatorBookTransport instanceId={resolvedParams.id} backUrl={`/tour-operator/tour-instances/private/${resolvedParams.id}`} />;
}
