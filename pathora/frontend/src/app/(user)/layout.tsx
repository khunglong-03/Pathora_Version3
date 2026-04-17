import type { ReactNode } from "react";
import { Suspense } from "react";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";

export default function UserRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="h-20 shrink-0" />}>
        <LandingHeader />
      </Suspense>
      <div className="flex-1">
        {children}
      </div>
      <LandingFooter />
    </div>
  );
}
