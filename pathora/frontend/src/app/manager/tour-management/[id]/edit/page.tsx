"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditTourRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params?.id as string;

  useEffect(() => {
    if (tourId) {
      // Redirect to list page with edit query param
      router.replace(`/tour-management?edit=true&id=${tourId}`);
    }
  }, [tourId, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
    </div>
  );
}
