import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import CheckoutLoading from "./loading";

export const metadata: Metadata = {
  title: "Checkout | Pathora",
  description:
    "Complete your booking securely. Review your tour details, enter passenger information, and proceed to payment.",
  openGraph: {
    title: "Checkout | Pathora",
    description:
      "Complete your booking securely. Review your tour details and proceed to payment.",
    type: "website",
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/checkout" },
  robots: { index: true, follow: true },
};

const CheckoutRequestPage = dynamic(
  () => import("@/features/checkout/components").then((m) => m.CheckoutRequestPage),
  { loading: () => <CheckoutLoading /> },
);

export default function CheckoutRequestRoute() {
  return <CheckoutRequestPage />;
}
