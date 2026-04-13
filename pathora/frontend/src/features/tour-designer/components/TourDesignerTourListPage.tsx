"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { TourDesignerLayout } from "./TourDesignerLayout";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useDebounce } from "@/hooks/useDebounce";
import { useTourDesignerTourList } from "../hooks/useTourDesignerTourList";
import { TourStatusMap } from "@/types/tour";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "3", label: "Pending" },
  { key: "1", label: "Active" },
  { key: "4", label: "Rejected" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  "1": { bg: "bg-green-100", text: "text-green-700" },
  "2": { bg: "bg-gray-100", text: "text-gray-700" },
  "3": { bg: "bg-amber-100", text: "text-amber-700" },
  "4": { bg: "bg-red-100", text: "text-red-700" },
};

export function TourDesignerTourListPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const debouncedSearch = useDebounce(searchText, 400);

  const { tours, total, state, errorMessage } = useTourDesignerTourList({
    searchText: debouncedSearch,
    statusFilter,
    pageNumber: currentPage,
    pageSize: 10,
  });

  const reload = () => setReloadToken((v) => v + 1);

  return (
    <TourDesignerLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("tourDesigner.myTours", "My Tours")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {total > 0
                ? `${total} ${t("tourDesigner.tourCount", "tour(s)")}`
                : t("tourDesigner.manageTours", "Manage your tour designs")}
            </p>
          </div>
          <Link
            href="/tour-designer/tours/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} weight="bold" />
            {t("tourDesigner.actions.create", "Create Tour")}
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={t("tourDesigner.searchPlaceholder", "Search tours...")}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                statusFilter === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(`tourDesigner.tabs.${tab.key}`, tab.label)}
            </button>
          ))}
        </div>

        {/* Content States */}
        {state === "loading" && <SkeletonTable rows={4} columns={4} />}

        {state === "error" && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-700 font-medium mb-3">
              {errorMessage ?? t("tourDesigner.messages.errorLoading", "Failed to load tours")}
            </p>
            <button
              onClick={() => void reload()}
              className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              {t("tourDesigner.actions.retry", "Retry")}
            </button>
          </div>
        )}

        {state === "empty" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🏖️</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t("tourDesigner.empty.title", "No tours yet")}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {t("tourDesigner.empty.description", "Create your first tour to get started")}
            </p>
            <Link
              href="/tour-designer/tours/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} weight="bold" />
              {t("tourDesigner.actions.create", "Create Tour")}
            </Link>
          </div>
        )}

        {state === "ready" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label={t("tourDesigner.tableAriaLabel", "My Tours list")}
              >
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-medium text-slate-600 px-4 py-3">
                      {t("tourDesigner.table.tourName", "Tour Name")}
                    </th>
                    <th className="text-left font-medium text-slate-600 px-4 py-3">
                      {t("tourDesigner.table.status", "Status")}
                    </th>
                    <th className="text-left font-medium text-slate-600 px-4 py-3">
                      {t("tourDesigner.table.createdDate", "Created Date")}
                    </th>
                    <th className="text-left font-medium text-slate-600 px-4 py-3">
                      {t("tourDesigner.table.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{tour.tourName}</span>
                        <div className="text-xs text-slate-400">{tour.tourCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          role="status"
                          aria-label={`${t("tourDesigner.statusBadge", "Status")}: ${TourStatusMap[Number(tour.status)] ?? tour.status}`}
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_BADGE[tour.status]?.bg ?? "bg-gray-100"} ${STATUS_BADGE[tour.status]?.text ?? "text-gray-700"}`}
                        >
                          {TourStatusMap[Number(tour.status)] ?? tour.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(tour.createdOnUtc).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/tour-designer/tours/${tour.id}`}
                            aria-label={t("tourDesigner.actions.viewAria", "View tour {{name}}", { name: tour.tourName })}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            {t("tourDesigner.actions.view", "View")}
                          </Link>
                          {tour.status === "3" && (
                            <Link
                              href={`/tour-designer/tours/${tour.id}/edit`}
                              aria-label={t("tourDesigner.actions.editAria", "Edit tour {{name}}", { name: tour.tourName })}
                              className="px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              {t("tourDesigner.actions.edit", "Edit")}
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 10 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {t("tourDesigner.pagination", "Page {{page}} of {{total}}", {
                    page: currentPage,
                    total: Math.ceil(total / 10),
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
                  >
                    {t("tourDesigner.prev", "Prev")}
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= Math.ceil(total / 10)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
                  >
                    {t("tourDesigner.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TourDesignerLayout>
  );
}
