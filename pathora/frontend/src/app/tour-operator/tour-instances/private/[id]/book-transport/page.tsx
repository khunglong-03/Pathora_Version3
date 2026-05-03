import React from "react";
import { TourOperatorBookTransport } from "@/features/tour-operator/components/TourOperatorBookTransport";

export default function PrivateBookTransportPage({ params }: { params: { id: string } }) {
  return <TourOperatorBookTransport instanceId={params.id} backUrl={`/tour-operator/tour-instances/private/${params.id}`} />;
}
