import React from "react";
import { SAMPLE_CANCELLATIONS } from "@/features/cancellations/components/CancellationData";
import { ManagerCancellationDetail } from "@/features/cancellations/components/ManagerCancellationDetail";

export default function ManagerCancellationPage({ params }: { params: { id: string } }) {
  // Use mock data. In a real app, fetch based on booking ID or cancellation ID.
  const data = SAMPLE_CANCELLATIONS["1"];

  return <ManagerCancellationDetail data={data} />;
}
