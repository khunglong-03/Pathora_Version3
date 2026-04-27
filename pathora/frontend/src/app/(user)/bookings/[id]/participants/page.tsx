import React from "react";
import { CustomerAddParticipants } from "@/features/bookings/components/CustomerAddParticipants";

export default function AddParticipantsPage({ params }: { params: { id: string } }) {
  // Use mock data / routing params
  return <CustomerAddParticipants bookingId={params.id || "BKG-2023-001"} />;
}
