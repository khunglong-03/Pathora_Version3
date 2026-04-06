import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import BookingsLoading from "./loading";

export const metadata: Metadata = {
  title: "My Bookings | Pathora",
  description:
    "View and manage your tour bookings with Pathora. Track booking status, view details, and access your travel itinerary.",
  openGraph: {
    title: "My Bookings | Pathora",
    description:
      "View and manage your tour bookings with Pathora. Track booking status and access your travel itinerary.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const BookingHistoryPage = dynamic(
  () =>
    import("@/features/bookings/components").then((m) => m.BookingHistoryPage),
  { loading: () => <BookingsLoading /> },
);

export default function BookingsRoute() {
  return <BookingHistoryPage />;
}
