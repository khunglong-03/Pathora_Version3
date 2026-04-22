"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import TourForm from "@/features/dashboard/components/TourForm";
import { tourService } from "@/api/services/tourService";
import type { TourDto, ImageDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

interface Props {
  mode: "create" | "edit";
  initialData?: TourDto;
  existingImages?: ImageDto[];
  showPolicySections?: boolean;
}

export function TourFormPage({ mode, initialData, existingImages, showPolicySections }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (
    formData: FormData,
    deletedClassificationIds?: string[],
    deletedPlanIds?: string[],
    deletedActivityIds?: string[],
    lastModifiedOnUtc?: string
  ) => {
    try {
      if (mode === "create") {
        await tourService.createTour(formData);
        toast.success(t("tourDesigner.messages.created", "Tour created successfully"));
      } else if (mode === "edit" && initialData?.id) {
        const currentStatus = initialData.status?.toString();
        // Tour Designers must resubmit Active/Rejected tours to Pending
        if (currentStatus === "1" || currentStatus === "3") {
          formData.set("status", "0"); 
        }
        
        const logData: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
          // Skip File objects so we can JSON.stringify it to the Next.js server
          if (typeof value === "string") {
            logData[key] = value;
          } else {
            logData[key] = "[File Object]";
          }
        }
        
        // Gửi data lên Next.js server (npm run dev terminal)
        try {
          await fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logData)
          });
        } catch (e) {
          console.error("Failed to send log to Next.js server", e);
        }

        await tourService.updateTour(formData, lastModifiedOnUtc);
        toast.success(t("tourDesigner.messages.updated", "Tour updated successfully"));
      }
      router.push("/tour-designer/tours");
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
      throw err; // Let TourForm keep form state
    }
  };

  return (
    <TourForm
      mode={mode}
      initialData={initialData}
      existingImages={existingImages}
      onSubmit={handleSubmit}
      showPolicySections={showPolicySections}
      onCancel={() => router.push("/tour-designer/tours")}
    />
  );
}
