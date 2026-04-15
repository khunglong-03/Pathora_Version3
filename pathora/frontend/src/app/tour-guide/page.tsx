"use client";

import React, { useEffect, useState } from "react";
import { MapTrifoldIcon } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function TourGuidePage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await tourInstanceService.getMyAssignedInstances(1, 20);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "soldout":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title={t("tourGuide.portalTitle") || "Tour Guide Portal"}
        subtitle={t("tourGuide.portalSubtitle") || "Quản lý các tour đang hướng dẫn"}
      />
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("tourGuide.noAssignedTours") || "Không có tour nào được phân công."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance) => (
              <Link
                key={instance.id}
                href={`/tour-guide/instances/${instance.id}`}
                className="block bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {instance.thumbnail && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={instance.thumbnail.publicURL}
                      alt={instance.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {instance.title}
                  </h3>
                  <div className="text-sm text-muted-foreground mb-3">
                    <div>{instance.tourName}</div>
                    <div>
                      {new Date(instance.startDate).toLocaleDateString()} -{" "}
                      {new Date(instance.endDate).toLocaleDateString()}
                    </div>
                    <div>
                      {t("tourInstance.days", { count: instance.durationDays }) ||
                        ` ${instance.durationDays} ngày`}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        instance.status
                      )}`}
                    >
                      {instance.status}
                    </span>
                    <span className="text-sm font-medium">
                      {instance.currentParticipation}/{instance.maxParticipation}{" "}
                      {t("tourInstance.participants") || "người tham gia"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}