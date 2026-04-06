import React from "react";
import dynamic from "next/dynamic";
import BookingDetailLoading from "./loading";

const BookingDetailPage = dynamic(
  () =>
    import("@/features/bookings/components").then((m) => m.BookingDetailPage),
  { loading: () => <BookingDetailLoading /> },
);

export default function BookingDetailRoute() {
  return <BookingDetailPage />;
}
