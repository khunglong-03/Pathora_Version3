import type { Metadata } from "next";

import { TourDesignerTourEditWrapper } from "@/features/tour-designer/components/TourDesignerTourEditWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Edit Tour | Tour Designer" };
}

export default async function EditTourPage() {
  return <TourDesignerTourEditWrapper />;
}
