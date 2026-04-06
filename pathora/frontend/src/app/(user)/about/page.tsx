import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import AboutLoading from "./loading";

export const metadata: Metadata = {
  title: "About Us | Pathora",
  description:
    "Learn about Pathora - a premier travel platform dedicated to creating memorable journeys. Discover our mission, team, and commitment to exceptional travel experiences.",
  openGraph: {
    title: "About Us | Pathora",
    description:
      "Learn about Pathora - a premier travel platform dedicated to creating memorable journeys across Vietnam and Asia.",
    type: "website",
  },
  twitter: { card: "summary" },
};

const AboutUsPage = dynamic(
  () => import("@/features/about/components").then((m) => m.AboutUsPage),
  { loading: () => <AboutLoading /> },
);

export default function About() {
  return <AboutUsPage />;
}
