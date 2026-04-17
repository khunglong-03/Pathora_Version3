"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import { tourRequestService } from "@/api/services/tourRequestService";
import {
  TOUR_REQUEST_STATUS_MAP,
  normalizeTourRequestStatus,
  type TourRequestDetailDto,
  type TourRequestVm,
} from "@/types/tourRequest";
import { handleApiError } from "@/utils/apiResponse";


const PAGE_SIZE = 10;

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString();
};

const formatBudget = (value: number): string => {
  if (!value || value <= 0) {
    return "-";
  }

  return `${new Intl.NumberFormat("en-US").format(value)} USD`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const normalizedStatus = normalizeTourRequestStatus(status);
  const statusMeta = TOUR_REQUEST_STATUS_MAP[normalizedStatus];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}
    >
      <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
      {t(statusMeta.labelKey)}
    </span>
  );
};

export default function MyTourRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<TourRequestVm[]>([]);
  const [detailById, setDetailById] = useState<Record<string, TourRequestDetailDto>>(
    {},
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  }, [totalItems]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await tourRequestService.getMyTourRequests({
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
      });

      setRequests(result.data);
      setTotalItems(result.total);
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, {
          defaultValue: t("tourRequest.toast.loadMyRequestsError"),
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, t]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
    setSelectedRequestId(null);
  };

  const handleToggleDetails = async (requestId: string) => {
    if (selectedRequestId === requestId) {
      setSelectedRequestId(null);
      return;
    }

    setSelectedRequestId(requestId);
    if (detailById[requestId]) {
      return;
    }

    setDetailLoadingId(requestId);

    try {
      const detail = await tourRequestService.getTourRequestDetail(requestId);
      if (detail) {
        setDetailById((prev) => ({
          ...prev,
          [requestId]: detail,
        }));
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, {
          defaultValue: t("tourRequest.toast.loadDetailError"),
        }),
      );
      setSelectedRequestId(null);
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">


      <section className="relative bg-linear-to-br from-[#05073c] via-[#1a1c5e] to-[#05073c] text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-8 h-64 w-64 rounded-full bg-[#fa8b02] blur-[120px]" />
          <div className="absolute right-10 bottom-8 h-72 w-72 rounded-full bg-[#eb662b] blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold">
            {t("tourRequest.page.myRequests.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">
            {t("tourRequest.page.myRequests.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`request-skeleton-${index}`}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-xl font-semibold text-slate-800">
              {t("tourRequest.list.emptyTitle")}
            </p>
            <p className="mt-2 text-slate-600">{t("tourRequest.list.emptyDescription")}</p>
            <Link
              href="/tours/custom"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              <Icon icon="heroicons:plus" className="size-4" />
              {t("tourRequest.buttons.createRequest")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const detail = detailById[request.id];
              const isExpanded = selectedRequestId === request.id;
              const isDetailLoading = detailLoadingId === request.id;

              return (
                <article
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => void handleToggleDetails(request.id)}
                    className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {request.destination}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span>
                            {t("tourRequest.form.numberOfParticipants")}:
                            {" "}
                            <strong>{request.numberOfParticipants}</strong>
                          </span>
                          <span>
                            {t("tourRequest.list.createdOn")}:
                            {" "}
                            <strong>{formatDate(request.createdOnUtc)}</strong>
                          </span>
                        </div>
                        {request.adminNote && (
                          <p className="mt-2 text-sm text-slate-700">
                            <strong>{t("tourRequest.list.adminNote")}:</strong>{" "}
                            {request.adminNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={request.status} />
                        <span className="text-xs font-medium text-orange-600 inline-flex items-center gap-1">
                          {isExpanded
                            ? t("tourRequest.list.hideDetails")
                            : t("tourRequest.list.showDetails")}
                          <Icon
                            icon={
                              isExpanded
                                ? "heroicons:chevron-up"
                                : "heroicons:chevron-down"
                            }
                            className="size-4"
                          />
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                      {isDetailLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Icon
                            icon="heroicons:arrow-path"
                            className="size-4 animate-spin"
                          />
                          {t("common.loading", "Loading...")}
                        </div>
                      ) : detail ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                          <div>
                            <strong>{t("tourRequest.form.destination")}:</strong>{" "}
                            {detail.destination}
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.startDate")}:</strong>{" "}
                            {formatDate(detail.startDate)}
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.endDate")}:</strong>{" "}
                            {formatDate(detail.endDate)}
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.numberOfParticipants")}:</strong>{" "}
                            {detail.numberOfParticipants}
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.budgetPerPerson")}:</strong>{" "}
                            {formatBudget(detail.budgetPerPersonUsd)}
                          </div>
                          <div>
                            <strong>{t("tourRequest.list.reviewedAt")}:</strong>{" "}
                            {formatDate(detail.reviewedAt)}
                          </div>
                          <div className="md:col-span-2">
                            <strong>{t("tourRequest.form.travelInterests")}:</strong>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {detail.travelInterests.length > 0 ? (
                                detail.travelInterests.map((interest) => (
                                  <span
                                    key={`${detail.id}-${interest}`}
                                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                                  >
                                    {t(
                                      `tourRequest.travelInterests.${interest.charAt(0).toLowerCase()}${interest.slice(1)}`,
                                      {
                                        defaultValue: interest,
                                      },
                                    )}
                                  </span>
                                ))
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.preferredAccommodation")}:</strong>{" "}
                            {detail.preferredAccommodation || "-"}
                          </div>
                          <div>
                            <strong>{t("tourRequest.form.transportationPreference")}:</strong>{" "}
                            {detail.transportationPreference || "-"}
                          </div>
                          <div className="md:col-span-2">
                            <strong>{t("tourRequest.form.specialRequests")}:</strong>{" "}
                            {detail.specialRequests || "-"}
                          </div>
                          <div className="md:col-span-2">
                            <strong>{t("tourRequest.list.adminNote")}:</strong>{" "}
                            {detail.adminNote || "-"}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">-</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <p className="text-sm text-slate-600">
                  {currentPage}/{totalPages}
                </p>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>


    </div>
  );
}
