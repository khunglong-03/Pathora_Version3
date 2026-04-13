import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tourService } from "@/api/services/tourService";
import { TourDesignerLayout } from "@/features/tour-designer/components/TourDesignerLayout";
import { TourDesignerTourDetailPage } from "@/features/tour-designer/components/TourDesignerTourDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Tour Detail | Tour Designer" };
}

export default async function TourDetailPage({ params }: Props) {
  const { id } = await params;

  let tour;
  try {
    tour = await tourService.getTourDetail(id);
  } catch {
    notFound();
  }

  if (!tour) notFound();

  return (
    <TourDesignerLayout>
      <TourDesignerTourDetailPage />
    </TourDesignerLayout>
  );
}