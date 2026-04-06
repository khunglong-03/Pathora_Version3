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
};

const CheckoutPage = dynamic(
  () => import("@/features/checkout/components").then((m) => m.CheckoutPage),
  { loading: () => <CheckoutLoading /> },
);

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
