import { redirect } from "next/navigation";

type TourRequestDetailRedirectPageProps = {
  params: { id: string };
};

export default function TourRequestDetailRedirectPage({
  params,
}: TourRequestDetailRedirectPageProps) {
  const { id } = params;
  redirect(`/dashboard/tour-requests/${id}`);
}
