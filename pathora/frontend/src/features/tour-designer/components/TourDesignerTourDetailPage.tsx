"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PencilSimple, Eye } from "@phosphor-icons/react";
import { TourDesignerLayout } from "./TourDesignerLayout";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourService } from "@/api/services/tourService";
import type { TourDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

type DetailState = "loading" | "ready" | "error";

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "1": { bg: "bg-green-100", text: "text-green-700", label: "Đã duyệt" },
  "3": { bg: "bg-amber-100", text: "text-amber-700", label: "Chờ duyệt" },
  "4": { bg: "bg-red-100", text: "text-red-700", label: "Từ chối" },
};

export function TourDesignerTourDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const tourId = params?.id as string;

  const [tour, setTour] = useState<TourDto | null>(null);
  const [dataState, setDataState] = useState<DetailState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    try {
      setDataState("loading");
      setErrorMessage(null);
      const result = await tourService.getTourDetail(tourId);
      if (result) {
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
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  if (dataState === "loading") {
    return (
      <TourDesignerLayout>
        <div className="max-w-5xl">
          <SkeletonTable rows={3} columns={3} />
        </div>
      </TourDesignerLayout>
    );
  }

  if (dataState === "error" || !tour) {
    return (
      <TourDesignerLayout>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-medium mb-3">
            {errorMessage ?? t("tourDesigner.messages.errorLoading", "Failed to load tour")}
          </p>
          <button
            onClick={() => void fetchTour()}
            className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            {t("tourDesigner.actions.retry", "Retry")}
          </button>
        </div>
      </TourDesignerLayout>
    );
  }

  const statusKey = String(tour.status ?? "");
  const badge = STATUS_BADGE[statusKey] ?? { bg: "bg-gray-100", text: "text-gray-700", label: statusKey };
  const canEdit = statusKey === "3"; // Only Pending status can be edited

  return (
    <TourDesignerLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/tour-designer/tours" className="hover:text-indigo-600 transition-colors">
          {t("tourDesigner.breadcrumb.myTours", "My Tours")}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{tour.tourName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tour.tourName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tour.shortDescription}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col items-end gap-2">
          <span
            role="status"
            aria-label={t("tourDesigner.statusBadge", "Status")}
            className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}
          >
            {TourStatusMap[Number(tour.status)] ?? badge.label}
          </span>

          {canEdit && (
            <Link
              href={`/tour-designer/tours/${tourId}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <PencilSimple size={16} />
              {t("tourDesigner.actions.edit", "Edit")}
            </Link>
          )}
        </div>
      </div>

      {/* Tour Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t("tourDesigner.tourDetail", "Tour Details")}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Tour Code:</span>
                <span className="ml-2 font-medium text-slate-900">{tour.tourCode}</span>
              </div>
              <div>
                <span className="text-slate-500">Scope:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {tour.tourScope === 1 ? "Domestic" : "International"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Customer Segment:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {tour.customerSegment === 2 ? "Group" : "Individual"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Created:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {tour.createdOnUtc ? new Date(tour.createdOnUtc).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>
            </div>

            {tour.longDescription && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{tour.longDescription}</p>
              </div>
            )}
          </div>

          {/* Images */}
          {tour.images && tour.images.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {t("tourDesigner.images", "Tour Images")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tour.images.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    {img.publicURL ? (
                      <img
                        src={img.publicURL}
                        alt={`Tour image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Eye size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packages/Classifications */}
          {tour.classifications && tour.classifications.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {t("tourDesigner.packages", "Tour Packages")}
              </h2>
              <div className="space-y-4">
                {tour.classifications.map((cls, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900">{cls.name}</h3>
                      <span className="text-sm font-semibold text-indigo-600">
                        {cls.price?.toLocaleString("vi-VN") ?? "-"} VND
                      </span>
                    </div>
                    {cls.description && (
                      <p className="text-sm text-slate-600">{cls.description}</p>
                    )}
                    {cls.durationDays && (
                      <p className="text-xs text-slate-400 mt-1">
                        {cls.durationDays} {t("tourDesigner.durationDays", "day(s)")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Thumbnail + Meta */}
        <div className="space-y-6">
          {/* Thumbnail */}
          {tour.thumbnail?.publicURL && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <img
                src={tour.thumbnail.publicURL}
                alt={tour.tourName}
                className="w-full aspect-video object-cover rounded-lg"
              />
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              {t("tourDesigner.quickInfo", "Quick Info")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${badge.text}`}>
                  {TourStatusMap[Number(tour.status)] ?? badge.label}
                </span>
              </div>
              {tour.translations?.en && (
                <div className="flex justify-between">
                  <span className="text-slate-500">English Name</span>
                  <span className="font-medium text-slate-900 truncate max-w-[120px]">
                    {tour.translations.en.tourName ?? "-"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TourDesignerLayout>
  );
}