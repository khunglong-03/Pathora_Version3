import React from "react";
import { TourDesignerBookAccommodation } from "@/features/tour-operator/components/TourDesignerBookAccommodation";

export default async function PrivateBookAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TourDesignerBookAccommodation instanceId={resolvedParams.id} backUrl={`/tour-operator/tour-instances/private/${resolvedParams.id}`} />;
}
