"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { homeService } from "@/api/services/homeService";
import { NormalizedTourInstanceVm, TourInstanceStatusMap } from "@/types/tour";
import { formatCurrency } from "@/utils/format";

interface ScheduledDeparturesSectionProps {
  tourId: string;
  apiLanguage: string;
}

export function ScheduledDeparturesSection({ tourId, apiLanguage }: ScheduledDeparturesSectionProps) {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const data = await homeService.getAvailablePublicInstances(
          undefined,
          1,
          50,
          apiLanguage,
        );
        if (!cancelled) {
          const filtered = (data?.data ?? []).filter(
            (inst: NormalizedTourInstanceVm) => inst.tourId === tourId,
          );
          setInstances(filtered);
        }
      } catch {
        if (!cancelled) {
          setInstances([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tourId, apiLanguage]);

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 animate-pulse reveal-on-scroll"
        style={{ boxShadow: "var(--shadow-warm-md)", background: "var(--tour-surface)" }}>
        <div className="h-5 w-56 bg-gray-200 rounded mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden reveal-on-scroll"
      style={{ boxShadow: "var(--shadow-warm-md)", background: "var(--tour-surface)" }}>
      <div className="p-6">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--tour-heading)" }}>
          <Icon
            icon="heroicons:calendar-days"
            className="size-5 text-[#fa8b02]"
          />
          {t("tourInstance.scheduledDepartures")}
        </h3>

        {instances.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              icon="heroicons:calendar"
              className="size-10 mx-auto mb-3"
              style={{ color: "var(--tour-caption)" }}
            />
            <p className="text-sm" style={{ color: "var(--tour-body)" }}>
              {t("tourInstance.noScheduledDepartures")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {instances.map((instance) => {
              const statusKey = instance.status
                .trim()
                .toLowerCase()
                .replace(/[\s_]+/g, "");
              const statusInfo = TourInstanceStatusMap[statusKey] ?? {
                label: instance.status,
                bg: "bg-gray-100",
                text: "text-gray-600",
                dot: "bg-gray-400",
              };
              const spotsLeft =
                (instance.maxParticipation ?? 0) -
                (instance.currentParticipation ?? 0);
              const startDateStr = new Date(
                instance.startDate,
              ).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const endDateStr = new Date(instance.endDate).toLocaleDateString(
                "vi-VN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              );

              return (
                <div
                  key={instance.id}
                  className="border rounded-xl p-4 transition-all duration-300 hover:shadow-[var(--shadow-warm-sm)]"
                  style={{
                    borderColor: "var(--tour-divider)",
                    background: "var(--tour-surface-raised)",
                  }}>
                  {/* Header: dates + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl p-2.5" style={{ background: "#fef3e4" }}>
                        <Icon
                          icon="heroicons:calendar"
                          className="size-4 text-[#fa8b02]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold line-clamp-1" style={{ color: "var(--tour-heading)" }}>
                          {instance.title || instance.tourName}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: "var(--tour-heading)" }}>
                          {startDateStr} — {endDateStr}
                        </span>
                        <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                          {instance.tourInstanceCode} • {instance.durationDays} {t("tourInstance.days")} &bull; {instance.classificationName}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                      <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                      {t(`tourInstance.statusLabels.${statusKey}`, statusInfo.label)}
                    </span>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-base font-bold tabular-nums" style={{ color: "#fa8b02" }}>
                          {formatCurrency(instance.basePrice)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                          {t("tourInstance.perPersonShort")}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold tabular-nums" style={{ color: "var(--tour-heading)" }}>
                          {spotsLeft}
                        </span>
                        <span className="text-xs" style={{ color: "var(--tour-caption)" }}>
                          {t("tourInstance.spotsAvailable")}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/tours/instances/${instance.id}`}
                      className="text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                      style={{
                        background: spotsLeft > 0 && statusKey === "available" ? "#fa8b02" : "var(--tour-surface-muted)",
                        color: spotsLeft > 0 && statusKey === "available" ? "white" : "var(--tour-heading)",
                        border: spotsLeft > 0 && statusKey === "available" ? "none" : "1px solid var(--tour-divider)",
                      }}>
                      {spotsLeft > 0 && statusKey === "available"
                        ? t("tourInstance.bookNow")
                        : t("tourInstance.viewDetails", "View details")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
