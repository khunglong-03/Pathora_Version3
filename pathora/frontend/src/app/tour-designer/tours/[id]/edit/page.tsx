import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { tourService } from "@/api/services/tourService";
import { TourDesignerLayout } from "@/features/tour-designer/components/TourDesignerLayout";
import { TourFormPage } from "@/features/tour-designer/components/TourFormPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Edit Tour | Tour Designer" };
}

export default async function EditTourPage({ params }: Props) {
  const { id } = await params;

  let tour;
  try {
    tour = await tourService.getTourDetail(id);
  } catch {
    notFound();
  }

  if (!tour) notFound();

  // Only allow edit for Pending status (status = 3)
  if (String(tour.status ?? "") !== "3") {
    redirect(`/tour-designer/tours/${id}`);
  }

  return (
    <TourDesignerLayout>
      <TourFormPage
        mode="edit"
        initialData={tour}
        existingImages={tour.images ?? []}
        showPolicySections={false}
      />
    </TourDesignerLayout>
  );
}