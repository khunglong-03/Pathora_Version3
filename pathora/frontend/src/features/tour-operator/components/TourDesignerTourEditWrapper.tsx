"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { tourService } from "@/api/services/tourService";
import type { TourDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { TourFormPage } from "@/features/tour-operator/components/TourFormPage";
import { canTourOperatorEditTour } from "@/features/tour-operator/components/editableTourStatus";

export function TourOperatorTourEditWrapper() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const tourId = params?.id as string;

  const [tour, setTour] = useState<TourDto | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    try {
      setDataState("loading");
      setErrorMessage(null);
      const result = await tourService.getTourDetail(tourId);
      if (result) {
        if (!canTourOperatorEditTour(result.status)) {
          router.push(`/tour-operator/tours/${tourId}`);
          return;
        }
        setTour(result);
        setDataState("ready");
      } else {
        setTour(null);
        setDataState("error");
        setErrorMessage("Tour not found");
      }
    } catch (error: unknown) {
      setDataState("error");
      setErrorMessage(handleApiError(error).message);
    }
  }, [tourId, router]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  if (dataState === "loading") {
    return (
      <div className="max-w-6xl w-full mx-auto p-6">
        <SkeletonTable rows={3} columns={3} />
      </div>
    );
  }

  if (dataState === "error" || !tour) {
    return (
      <div className="max-w-6xl w-full mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-medium mb-3">
            {errorMessage ?? t("tourOperator.messages.errorLoading", "Failed to load tour")}
          </p>
          <button
            onClick={() => void fetchTour()}
            className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            {t("tourOperator.actions.retry", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <TourFormPage
      mode="edit"
      initialData={tour}
      existingImages={tour.images ?? []}
      showPolicySections={false}
    />
  );
}
