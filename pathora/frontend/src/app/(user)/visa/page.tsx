import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import VisaLoading from "./loading";

export const metadata: Metadata = {
  title: "Visa Services | Pathora",
  description:
    "Apply for visa assistance with Pathora. We help simplify the visa application process for your international travel.",
  openGraph: {
    title: "Visa Services | Pathora",
    description:
      "Apply for visa assistance with Pathora. We help simplify the visa application process for international travel.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const VisaApplicationPage = dynamic(
  () => import("@/features/visa/components").then((m) => m.VisaApplicationPage),
  { loading: () => <VisaLoading /> },
);

export default function VisaRoute() {
  return <VisaApplicationPage />;
}
