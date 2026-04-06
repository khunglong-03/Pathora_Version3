"use client";

import dynamic from "next/dynamic";
import CustomTourLoading from "./loading";

const CustomTourPage = dynamic(
  () =>
    import("@/features/custom-tour/components").then((m) => m.CustomTourPage),
  { loading: () => <CustomTourLoading /> },
);

export default function CustomTour() {
  return <CustomTourPage />;
}
