import { redirect } from "next/navigation";

type TourRequestDetailRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TourRequestDetailRedirectPage({
  params,
}: TourRequestDetailRedirectPageProps) {
  const { id } = await params;
  redirect(`/dashboard/tour-requests/${id}`);
}
