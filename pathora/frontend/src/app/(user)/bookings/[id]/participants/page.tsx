import React from "react";
import { CustomerAddParticipants } from "@/features/bookings/components/CustomerAddParticipants";

export default async function AddParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CustomerAddParticipants bookingId={resolvedParams.id} />;
}
