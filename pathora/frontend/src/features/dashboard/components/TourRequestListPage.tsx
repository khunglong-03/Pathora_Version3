"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icon, TourRequestStatusBadge } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourRequestService } from "@/api/services/tourRequestService";
import { useDebounce } from "@/hooks/useDebounce";
import {
  normalizeTourRequestStatus,
  type TourRequestStatus,
  type TourRequestVm,
} from "@/types/tourRequest";
import { TourRequestAdminLayout } from "./TourRequestAdminLayout";

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

const formatTravelDate = (startDate: string, endDate: string): string => {
  const normalizedStartDate = formatDate(startDate);
  const normalizedEndDate = formatDate(endDate);

  if (!normalizedEndDate || normalizedStartDate === normalizedEndDate) {
    return normalizedStartDate;
  }

  return `${normalizedStartDate} - ${normalizedEndDate}`;
};

/* (TourRequestStatusBadge imported from @/components/ui) */

type TourRequestDataState = "loading" | "ready" | "empty" | "error";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

/* ══════════════════════════════════════════════════════════════
   Stat Card
   ══════════════════════════════════════════════════════════════ */
interface StatCardProps {
  label: string;
  value: number;
  borderColor: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({
  label,
  value,
  borderColor,
  icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`bg-white rounded-[2.5rem] border border-stone-200/50 p-5 flex items-center gap-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${borderColor}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
      >
        <Icon icon={icon} className={`size-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-stone-900 data-value">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Page Header
   ══════════════════════════════════════════════════════════════ */
function PageHeader() {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          {t("tourRequest.page.adminRequests.title")}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {t("tourRequest.page.adminRequests.subtitle")}
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Filter Bar
   ══════════════════════════════════════════════════════════════ */
interface FilterBarProps {
  status: TourRequestStatus | "All";
  setStatus: (v: TourRequestStatus | "All") => void;
  searchText: string;
  setSearchText: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
}

function FilterBar({
  status,
  setStatus,
  searchText,
  setSearchText,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      className="rounded-[2.5rem] border border-stone-200/50 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
      variants={itemVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("tourRequest.filters.status")}
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TourRequestStatus | "All");
            }}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          >
            <option value="All">{t("tourRequest.filters.allStatuses")}</option>
            <option value="Pending">{t("tourRequest.status.pending")}</option>
            <option value="Approved">{t("tourRequest.status.approved")}</option>
            <option value="Rejected">{t("tourRequest.status.rejected")}</option>
            <option value="Cancelled">{t("tourRequest.status.cancelled")}</option>
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("tourRequest.filters.search")}
          </label>
          <div className="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400"
            />
            <input
              type="text"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
              }}
              className="w-full rounded-xl border border-stone-200 pl-10 pr-10 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder={t("tourRequest.filters.search")}
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <Icon icon="heroicons:x-mark" className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("tourRequest.filters.fromDate")}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("tourRequest.filters.toDate")}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
        </div>
      </div>
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════════════════
   Error State
   ══════════════════════════════════════════════════════════════ */
function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6"
      variants={itemVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Icon
              icon="heroicons:exclamation-circle"
              className="size-5 text-red-600"
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-800">
              {t("tourRequest.error.title", "Could not load tour requests")}
            </h2>
            <p className="text-sm text-red-700 mt-1">
              {message ??
                t(
                  "tourRequest.error.fallback",
                  "Unable to load tour request data. Please try again.",
                )}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors shrink-0"
        >
          {t("tourRequest.common.retry", "Retry")}
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Empty State
   ══════════════════════════════════════════════════════════════ */
function EmptyState() {
  const { t } = useTranslation();

  return (
    <motion.div
      className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 text-center"
      variants={itemVariants}
      initial="hidden"
      animate="show"
    >
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto">
        <Icon
          icon="heroicons:clipboard-document"
          className="size-7 text-stone-400"
        />
      </div>
      <h2 className="text-lg font-semibold text-stone-800 mt-4">
        {t("tourRequest.empty.title", "No tour requests found")}
      </h2>
      <p className="text-sm text-stone-500 mt-1">
        {t(
          "tourRequest.empty.description",
          "There are no tour requests matching your current filters.",
        )}
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Pagination
   ══════════════════════════════════════════════════════════════ */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-stone-500">
          {t("common.showing", "Showing")} {showingFrom}-{showingTo}{" "}
          {t("common.of", "of")} {totalItems}
        </p>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
          }}
          className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="p-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <Icon
              icon="heroicons:chevron-double-left"
              className="size-4"
            />
          </button>
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <Icon icon="heroicons:chevron-left" className="size-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 1,
            )
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="text-sm text-stone-400 px-1">...</span>
                )}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage
                      ? "bg-orange-500 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}

          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <Icon icon="heroicons:chevron-right" className="size-4" />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="p-2 rounded-lg text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <Icon
              icon="heroicons:chevron-double-right"
              className="size-4"
            />
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TourRequestListPage
   ══════════════════════════════════════════════════════════════ */
export function TourRequestListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [requests, setRequests] = useState<TourRequestVm[]>([]);
  const [dataState, setDataState] = useState<TourRequestDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<TourRequestStatus | "All">("All");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const loadRequests = useCallback(async () => {
    setDataState("loading");
    setErrorMessage(null);

    try {
      const result = await tourRequestService.getAllTourRequests({
        status,
        searchText: debouncedSearchText,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        pageNumber: currentPage,
        pageSize,
      });

      if (result.data.length === 0) {
        setRequests([]);
        setDataState("empty");
      } else {
        setRequests(result.data);
        setTotalItems(result.total);
        setDataState("ready");
      }
    } catch (error) {
      setRequests([]);
      setDataState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t(
              "tourRequest.toast.loadAdminRequestsError",
              "Failed to load tour requests",
            ),
      );
    }
  }, [currentPage, debouncedSearchText, fromDate, pageSize, status, t, toDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, [loadRequests, reloadToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [debouncedSearchText]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  const pendingCount = useMemo(
    () => requests.filter((r) => normalizeTourRequestStatus(r.status) === "Pending").length,
    [requests],
  );

  const approvedCount = useMemo(
    () => requests.filter((r) => normalizeTourRequestStatus(r.status) === "Approved").length,
    [requests],
  );

  const rejectedCount = useMemo(
    () => requests.filter((r) => normalizeTourRequestStatus(r.status) === "Rejected").length,
    [requests],
  );

  return (
    <TourRequestAdminLayout
      title={t("tourRequest.page.adminRequests.title")}
      subtitle={t("tourRequest.page.adminRequests.subtitle")}
    >
      <div className="max-w-7xl mx-auto space-y-5">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <PageHeader />

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard
              label={t("tourRequest.stat.total", "Total Requests")}
              value={totalItems}
              borderColor="border-stone-300"
              icon="heroicons:clipboard-document-list"
              iconBg="bg-stone-100"
              iconColor="text-stone-600"
            />
            <StatCard
              label={t("tourRequest.stat.pending", "Pending")}
              value={pendingCount}
              borderColor="border-amber-400"
              icon="heroicons:clock"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <StatCard
              label={t("tourRequest.stat.approved", "Approved")}
              value={approvedCount}
              borderColor="border-emerald-400"
              icon="heroicons:check-circle"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <StatCard
              label={t("tourRequest.stat.rejected", "Rejected")}
              value={rejectedCount}
              borderColor="border-red-400"
              icon="heroicons:x-circle"
              iconBg="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

          {/* ── Filter Bar ── */}
          <div className="mt-6">
            <FilterBar
              status={status}
              setStatus={setStatus}
              searchText={searchText}
              setSearchText={setSearchText}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>

          {/* ── Data Table ── */}
          <motion.section
            className="rounded-[2.5rem] border border-stone-200/50 bg-white overflow-hidden mt-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            {isLoading && <SkeletonTable rows={5} columns={8} />}

            {isError && (
              <div className="p-6">
                <ErrorState message={errorMessage} onRetry={retryLoading} />
              </div>
            )}

            {isEmpty && (
              <div className="p-6">
                <EmptyState />
              </div>
            )}

            {canShowData && !isEmpty && !isError && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.index")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.destination")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.travelDate")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.participants")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.budget")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.status")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.createdOn")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("tourRequest.admin.table.actions")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100">
                      {requests.map((request, index) => (
                        <tr
                          key={request.id}
                          className="hover:bg-stone-50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(
                              `/dashboard/tour-requests/${request.id}`,
                            )
                          }
                        >
                          <td className="px-4 py-3.5 text-stone-700 data-value">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-stone-900 tracking-tight">
                            {request.destination}
                          </td>
                          <td className="px-4 py-3.5 text-stone-700">
                            {formatTravelDate(request.startDate, request.endDate)}
                          </td>
                          <td className="px-4 py-3.5 text-stone-700 data-value">
                            {request.numberOfParticipants}
                          </td>
                          <td className="px-4 py-3.5 text-stone-700 data-value">
                            {formatBudget(request.budgetPerPersonUsd)}
                          </td>
                          <td className="px-4 py-3.5">
                            <TourRequestStatusBadge status={request.status} />
                          </td>
                          <td className="px-4 py-3.5 text-stone-700">
                            {formatDate(request.createdOnUtc)}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(
                                  `/dashboard/tour-requests/${request.id}`,
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-colors"
                            >
                              <Icon icon="heroicons:eye" className="size-4" />
                              {t("tourRequest.common.view", "View")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalItems > 0 && (
                  <div className="border-t border-stone-200 px-4 py-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                )}
              </>
            )}
          </motion.section>
        </motion.div>
      </div>
    </TourRequestAdminLayout>
  );
}
