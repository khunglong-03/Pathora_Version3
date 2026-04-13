import type { Metadata } from "next";

import { TourDesignerTourDetailPage } from "@/features/tour-designer/components/TourDesignerTourDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Tour Detail | Tour Designer" };
}

export default async function TourDetailPage() {
  return <TourDesignerTourDetailPage />;
}