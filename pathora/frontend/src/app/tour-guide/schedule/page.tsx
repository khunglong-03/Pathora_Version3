"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import { useTranslation } from "react-i18next";
import { TourGuideSchedule } from "@/features/tour-guide/components/TourGuideSchedule";

export default function TourGuideSchedulePage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await tourInstanceService.getMyAssignedInstances(1, 100);
        if (result) {
          setInstances(result.data);
        } else {
          setError(t("common.errors.loadFailed") || "Failed to load data");
        }
      } catch (err) {
        setError(t("common.errors.loadFailed") || "Failed to load data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [t]);

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <div className="p-4 md:p-6 pb-0">
        <AdminPageHeader
          title={t("tourGuide.portalTitle") || "Tour Guide Workspace"}
          subtitle={t("tourGuide.portalSubtitle") || "Quản lý công việc và hoạt động tour"}
        />
      </div>

      <div className="flex-1 mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : (
          <TourGuideSchedule instances={instances} />
        )}
      </div>
    </div>
  );
}
