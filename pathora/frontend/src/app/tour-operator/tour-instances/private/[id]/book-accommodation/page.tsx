import React from "react";
import { TourDesignerBookAccommodation } from "@/features/tour-operator/components/TourDesignerBookAccommodation";

export default function PrivateBookAccommodationPage({ params }: { params: { id: string } }) {
  return <TourDesignerBookAccommodation instanceId={params.id} backUrl={`/tour-operator/tour-instances/private/${params.id}`} />;
}
