import React from "react";
import { SAMPLE_CANCELLATIONS } from "@/features/cancellations/components/CancellationData";
import { CustomerCancellationDetail } from "@/features/cancellations/components/CustomerCancellationDetail";

export default async function CustomerCancellationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Use mock data. In a real app, fetch based on booking ID or cancellation ID.
  const data = SAMPLE_CANCELLATIONS["1"];

  return <CustomerCancellationDetail data={data} />;
}
