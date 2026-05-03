"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import { useTranslation } from "react-i18next";
import { TourGuideSchedule } from "@/features/tour-guide/components/TourGuideSchedule";
import { TourGuideOperations } from "@/features/tour-guide/components/TourGuideOperations";
import { CalendarBlank, CheckSquareOffset } from "@phosphor-icons/react";

export default function TourGuidePage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "operations">("schedule");

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
        ) : activeTab === "schedule" ? (
          <TourGuideSchedule instances={instances} />
        ) : (
          <TourGuideOperations instances={instances} />
        )}
      </div>

      {/* Bottom Navigation for Mobile / Fixed bottom for all */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 py-2 z-50 md:sticky md:bottom-auto md:w-full md:border-none md:bg-transparent md:px-6 md:pb-6">
        <div className="flex bg-slate-100 p-1 rounded-[1.5rem] md:max-w-md md:mx-auto">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.2rem] text-sm font-bold transition-all ${
              activeTab === "schedule"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CalendarBlank weight={activeTab === "schedule" ? "fill" : "regular"} className="size-5" />
            Lịch Trình
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.2rem] text-sm font-bold transition-all ${
              activeTab === "operations"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckSquareOffset weight={activeTab === "operations" ? "fill" : "regular"} className="size-5" />
            Hoạt Động
          </button>
        </div>
      </div>
    </div>
  );
}