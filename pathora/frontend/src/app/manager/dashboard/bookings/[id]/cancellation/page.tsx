import React from "react";
import { SAMPLE_CANCELLATIONS } from "@/features/cancellations/components/CancellationData";
import { ManagerCancellationDetail } from "@/features/cancellations/components/ManagerCancellationDetail";

export default async function ManagerCancellationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Use mock data. In a real app, fetch based on booking ID or cancellation ID.
  const data = SAMPLE_CANCELLATIONS["1"];

  return <ManagerCancellationDetail data={data} />;
}
