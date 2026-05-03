import React from "react";
import { TourGuideCheckIn } from "@/features/tour-guide/components/TourGuideCheckIn";

export default async function TourGuideCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourGuideCheckIn instanceId={resolvedParams.id || "INST-001"} />;
}
