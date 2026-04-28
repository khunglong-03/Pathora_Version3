import type { Metadata } from "next";

import { TourOperatorTourDetailPage } from "@/features/tour-operator/components/TourOperatorTourDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Tour Detail | Tour Operator" };
}

export default async function TourDetailPage() {
  return <TourOperatorTourDetailPage />;
}