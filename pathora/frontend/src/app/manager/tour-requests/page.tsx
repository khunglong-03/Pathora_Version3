import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tour Requests | Pathora",
  description: "Review and manage customer tour requests in Pathora admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TourRequestsPage() {
  redirect("/dashboard/tour-requests");
}
