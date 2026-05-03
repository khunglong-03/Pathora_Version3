import React from "react";
import HotelTourAssignmentPage from "@/features/dashboard/components/HotelTourAssignmentPage";

export default async function PrivateBookAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <HotelTourAssignmentPage instanceId={resolvedParams.id} backUrl={`/tour-operator/tour-instances/private/${resolvedParams.id}`} />;
}
