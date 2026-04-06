import React from "react";
import dynamic from "next/dynamic";
import TourDetailLoading from "./loading";

const TourDetailPage = dynamic(
  () => import("@/features/tours/components").then((m) => m.TourDetailPage),
  { loading: () => <TourDetailLoading /> },
);

export default function TourDetailRoute() {
  return <TourDetailPage />;
}
