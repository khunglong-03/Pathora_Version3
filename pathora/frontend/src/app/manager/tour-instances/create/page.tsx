import { CreateTourInstancePage } from "@/features/dashboard/components/CreateTourInstancePage";
import { Suspense } from "react";
export default function CreateTourInstanceRoute({
  searchParams,
}: {
  searchParams: Promise<{ tourRequestId?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <CreateTourInstancePageWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function CreateTourInstancePageWrapper({
  searchParams,
}: {
  searchParams: Promise<{ tourRequestId?: string }>;
}) {
  const params = await searchParams;
  const tourRequestId = params.tourRequestId;
  return <CreateTourInstancePage prefillTourRequestId={tourRequestId} />;
}
