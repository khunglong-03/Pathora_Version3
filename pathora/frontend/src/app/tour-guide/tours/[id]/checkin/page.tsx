import React from "react";
import { TourGuideCheckIn } from "@/features/tour-guide/components/TourGuideCheckIn";

export default function TourGuideCheckInPage({ params }: { params: { id: string } }) {
  return <TourGuideCheckIn instanceId={params.id || "INST-001"} />;
}
