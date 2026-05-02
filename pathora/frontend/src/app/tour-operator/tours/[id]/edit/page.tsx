import type { Metadata } from "next";

import { TourOperatorTourEditWrapper } from "@/features/tour-operator/components/TourOperatorTourEditWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Edit Tour | Tour Operator" };
}

export default async function EditTourPage() {
  return <TourOperatorTourEditWrapper />;
}
