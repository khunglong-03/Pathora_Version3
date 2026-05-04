/**
 * Generic fallback route: /tour-operator/tour-instances/[id]
 *
 * Decision (task 7.1): redirect (option b)
 *   - instanceType === "Public"  → /tour-operator/tour-instances/public/[id]
 *   - instanceType === "Private" → /tour-operator/tour-instances/private/[id]
 *
 * Uses a lightweight client redirect component so we don't block SSR with an
 * API call on every page load. The typed sub-routes render the correct variant.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { featureFlags } from "@/configs/featureFlags";
import TourInstanceDetailPage from "@/features/dashboard/components/TourInstanceDetailPage";

export default function TourOperatorTourInstanceFallbackRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [renderInline, setRenderInline] = useState(!featureFlags.enablePublicTourSubRoutes);

  useEffect(() => {
    if (renderInline) return;

    const id = params?.id;
    if (!id) return;

    tourInstanceService
      .getInstanceDetail(id)
      .then((instance) => {
        const type = (instance?.instanceType ?? "").toLowerCase();
        if (type === "public" && featureFlags.enablePublicTourSubRoutes) {
          router.replace(`/tour-operator/tour-instances/public/${id}`);
        } else if (type === "public") {
          setRenderInline(true);
        } else {
          router.replace(`/tour-operator/tour-instances/private/${id}`);
        }
      })
      .catch(() => {
        // If we can't determine the type, fall back to private (safe default)
        router.replace(`/tour-operator/tour-instances/private/${id}`);
      });
  }, [params?.id, router, renderInline]);

  if (renderInline) {
    return <TourInstanceDetailPage />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <svg
          className="size-8 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
