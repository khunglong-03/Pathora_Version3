import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PoliciesLoading from "./loading";

export const metadata: Metadata = {
  title: "Travel Policies | Pathora",
  description:
    "Read Pathora's travel policies including booking terms, cancellation policies, payment information, and frequently asked questions.",
  openGraph: {
    title: "Travel Policies | Pathora",
    description:
      "Read Pathora's travel policies including booking terms, cancellation policies, and payment information.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const PolicyPage = dynamic(
  () => import("@/features/policies/components").then((m) => m.PolicyPage),
  { loading: () => <PoliciesLoading /> },
);

export default function PoliciesPage() {
  return <PolicyPage />;
}
