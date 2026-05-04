"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AdminPageHeader } from "@/features/dashboard/components";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { MapPinIcon, CalendarBlankIcon, UsersIcon, CheckCircleIcon, HourglassHighIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";

export default function TourGuideOperationsPage() {
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

  // Filter only Confirmed and InProgress tours for the operations list
  const activeTours = useMemo(() => {
    return instances.filter(
      (tour) => tour.status.toLowerCase() === "confirmed" || tour.status.toLowerCase() === "inprogress"
    );
  }, [instances]);

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <div className="p-4 md:p-6 pb-0">
        <AdminPageHeader
          title={t("tourGuide.operations.title") || "Operations"}
          subtitle="Quản lý các hoạt động tour bạn được phân công"
        />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200 animate-pulse flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <WarningCircleIcon size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-slate-500">{error}</p>
          </div>
        ) : activeTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {t("tourGuide.operations.emptyState") || "Chưa có hoạt động nào"}
            </h3>
            <p className="text-slate-500 max-w-sm">
              Bạn hiện không có tour nào đang diễn ra hoặc sắp tới. Vui lòng kiểm tra lịch làm việc của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTours.map((tour) => {
              const startDate = new Date(tour.startDate);
              const endDate = new Date(tour.endDate);
              const isOngoing = tour.status === "inprogress";

              return (
                <Link
                  href={`/tour-guide/operations/${tour.id}`}
                  key={tour.id}
                  className="group block bg-white rounded-[1.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${isOngoing ? "bg-slate-900" : "bg-emerald-500"}`} />
                  
                  <div className="flex justify-between items-center mb-5 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      isOngoing 
                        ? "bg-slate-100 text-slate-900"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                    }`}>
                      {isOngoing ? <HourglassHighIcon weight="fill" size={14} /> : <CalendarBlankIcon weight="fill" size={14} />}
                      {isOngoing ? "Đang thực hiện" : "Sắp tới"}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      #{tour.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-slate-900 leading-tight mb-6 group-hover:text-slate-700 transition-colors line-clamp-2">
                    {tour.tourName}
                  </h3>

                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <CalendarBlankIcon className="text-slate-400 shrink-0" size={18} />
                      <span>{format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}</span>
                    </div>
                    
                    {tour.location && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <MapPinIcon className="text-slate-400 shrink-0" size={18} />
                        <span className="truncate">{tour.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <UsersIcon className="text-slate-400 shrink-0" size={18} />
                      <span>{tour.currentParticipation || 0} hành khách</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
