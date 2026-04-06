import { redirect } from "next/navigation";

export default function AdminCustomTourRequestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect("/dashboard/tour-requests");
}
