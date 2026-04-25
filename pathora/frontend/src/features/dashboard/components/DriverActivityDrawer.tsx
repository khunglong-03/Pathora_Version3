"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Transition, TransitionChild } from "@headlessui/react";
import { Icon } from "@/components/ui";
import Button from "@/components/ui/Button";
import { adminService } from "@/api/services/adminService";
import type { DriverActivity, DriverSummary } from "@/types/admin";
import { toast } from "react-toastify";

interface DriverActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverSummary | null;
  providerId: string;
}

export const DriverActivityDrawer = ({
  isOpen,
  onClose,
  driver,
  providerId,
}: DriverActivityDrawerProps) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<DriverActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen && driver && providerId) {
      loadActivities();
    } else if (!isOpen) {
      setActivities([]);
      setPage(1);
      setTotal(0);
    }
  }, [isOpen, driver, providerId]);

  const loadActivities = async (pageNumber = 1) => {
    if (!driver || !providerId) return;
    
    setIsLoading(true);
    try {
      const result = await adminService.getDriverActivities(providerId, driver.id, {
        page: pageNumber,
        limit: 20,
      });
      
      if (result) {
        if (pageNumber === 1) {
          setActivities(result.items);
        } else {
          setActivities((prev) => [...prev, ...result.items]);
        }
        setTotal(result.total);
        setPage(pageNumber);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadActivities(page + 1);
  };

  const getStatusBadge = (status?: number) => {
    // 0: Pending, 1: InProgress, 2: Completed, 3: Rejected, 4: Cancelled
    switch (status) {
      case 2:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 text-green-700">
            Completed
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700">
            In Progress
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700">
            Rejected
          </span>
        );
      case 4:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-yellow-100 text-yellow-700">
            Pending
          </span>
        );
    }
  };

  return (
    <Transition show={isOpen}>
      <div className="fixed inset-0 z-[60]">
        {/* Backdrop */}
        <TransitionChild
          enter="transition-opacity duration-300 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        </TransitionChild>

        {/* Drawer Content */}
        <TransitionChild
          enter="transform transition duration-300 ease-out"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition duration-200 ease-in"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Driver Activity</h2>
                <p className="text-sm text-slate-500">{driver?.fullName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <Icon icon="heroicons-outline:x" className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {isLoading && activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <div className="w-8 h-8 border-4 border-[#fa8b02] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Loading activity logs...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Icon icon="lucide:clipboard-list" className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No activities found</p>
                  <p className="text-xs text-slate-400 mt-1">This driver hasn't been assigned to any trips yet.</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                  <div className="space-y-8">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 ${
                          activity.status === 2 ? "bg-green-500" : activity.status === 1 ? "bg-blue-500" : "bg-slate-300"
                        }`} />

                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              {activity.updatedAt ? new Date(activity.updatedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }) : "Date unknown"}
                            </span>
                            {getStatusBadge(activity.status)}
                          </div>

                          <h3 className="font-bold text-slate-900 leading-snug mb-1">
                            {activity.activityTitle}
                          </h3>
                          <p className="text-xs text-[#fa8b02] font-medium mb-3">
                            {activity.bookingTitle}
                          </p>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Start Time</p>
                              <p className="text-xs font-semibold text-slate-700">
                                {activity.startTime ? new Date(activity.startTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) : "--:--"}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">End Time</p>
                              <p className="text-xs font-semibold text-slate-700">
                                {activity.endTime ? new Date(activity.endTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) : "--:--"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                              <Icon icon="lucide:truck" className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle</p>
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {activity.vehicleType ?? "No vehicle assigned"}
                              </p>
                            </div>
                          </div>

                          {activity.rejectionReason && (
                            <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                              <p className="text-[10px] text-red-400 font-bold uppercase mb-0.5">Rejection Reason</p>
                              <p className="text-xs text-red-700 italic">"{activity.rejectionReason}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {activities.length < total && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="text-xs font-bold text-[#fa8b02] bg-[#fa8b02]/5 hover:bg-[#fa8b02]/10 px-6 py-2 rounded-full transition-colors border-none"
                      >
                        {isLoading ? "Loading..." : "Load More Activities"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
};
