"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CurrencyDollar,
  Truck,
  TrendUp,
  ChartLine,
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type {
  RevenueSummary,
  TripHistoryItem,
} from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import Chart from "@/components/ui/Chart";
import type { ApexOptions } from "apexcharts";

type QuarterFilter = "all" | 1 | 2 | 3 | 4;

const QUARTER_TABS: { key: QuarterFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: 1, label: "Q1" },
  { key: 2, label: "Q2" },
  { key: 3, label: "Q3" },
  { key: 4, label: "Q4" },
];

const YEAR_OPTIONS = [2026, 2025, 2024];

const formatVND = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function TransportRevenuePage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilter>("all");
  const pageSize = 20;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const quarter = selectedQuarter === "all" ? undefined : (selectedQuarter as number);
      const [summaryData, historyData] = await Promise.all([
        transportProviderService.getRevenueSummary(selectedYear, quarter),
        transportProviderService.getTripHistory(currentPage, pageSize),
      ]);
      setSummary(summaryData);
      if (historyData) {
        setTripHistory(historyData.items);
        setTotalPages(historyData.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedQuarter, currentPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Build chart data from monthly breakdown (last 6 months)
  const chartData = summary?.monthlyBreakdown?.slice(-6) ?? [];
  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "60%",
      },
    },
    colors: ["#6366F1"],
    xaxis: {
      categories: chartData.map((m) =>
        `T${m.month}/${m.year.toString().slice(2)}`,
      ),
      labels: {
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          val >= 1_000_000
            ? `${(val / 1_000_000).toFixed(1)}M`
            : val >= 1_000
            ? `${(val / 1_000).toFixed(0)}K`
            : `${val}`,
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val: number) => formatVND(val),
      },
    },
  };
  const chartSeries = [
    {
      name: "Doanh thu",
      data: chartData.map((m) => m.revenue),
    },
  ];

  // KPI cards
  const kpis = [
    {
      label: "Tổng doanh thu",
      value: summary ? formatVND(summary.totalRevenue) : "-",
      icon: "CurrencyDollar" as const,
      accent: "#6366F1",
    },
    {
      label: "Chuyến hoàn thành",
      value: summary?.completedTrips?.toString() ?? "-",
      icon: "Truck" as const,
      accent: "#22C55E",
    },
    {
      label: "TB / chuyến",
      value: summary?.avgRevenuePerTrip
        ? formatVND(summary.avgRevenuePerTrip)
        : "-",
      icon: "TrendUp" as const,
      accent: "#F59E0B",
    },
    {
      label: "Tháng này",
      value:
        summary?.monthlyBreakdown?.length
          ? formatVND(
              summary.monthlyBreakdown[summary.monthlyBreakdown.length - 1]
                .revenue ?? 0,
            )
          : "-",
      icon: "ChartLine" as const,
      accent: "#C9873A",
    },
  ];

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Doanh thu"
        subtitle={`Năm ${selectedYear}`}
        onRefresh={() => void loadData()}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(parseInt(e.target.value, 10));
            setCurrentPage(1);
          }}
          className="px-4 py-2 rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-400 bg-white appearance-none cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {QUARTER_TABS.map((q) => (
            <button
              key={q.key}
              onClick={() => {
                setSelectedQuarter(q.key);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                selectedQuarter === q.key ? "text-white" : "border"
              }`}
              style={
                selectedQuarter === q.key
                  ? { backgroundColor: "#6366F1" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
              aria-pressed={selectedQuarter === q.key}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadData()} />
      )}

      {/* KPI Cards */}
      {!error && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-[#E5E7EB] p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                  {kpi.label}
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: "#111827" }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {!error && !isLoading && chartData.length > 0 && (
        <div
          className="rounded-xl p-6 mb-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>
              Doanh thu theo tháng (6 tháng gần nhất)
            </h3>
          </div>
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={280}
          />
        </div>
      )}

      {/* Empty state for no data */}
      {!error && !isLoading && chartData.length === 0 && (
        <AdminEmptyState
          icon="CurrencyDollar"
          heading="Chưa có dữ liệu doanh thu"
          description="Doanh thu sẽ hiển thị sau khi có chuyến hoàn thành."
        />
      )}

      {/* Trip History Table */}
      {!error && !isLoading && tripHistory.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#111827" }}>
              Lịch sử chuyến
            </h3>
          </div>
          <table className="w-full text-sm" role="table" aria-label="Lịch sử chuyến">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Mã chuyến</th>
                <th className="px-4 py-3 font-medium">Tuyến đường</th>
                <th className="px-4 py-3 font-medium">Ngày hoàn thành</th>
                <th className="px-4 py-3 font-medium">Xe</th>
                <th className="px-4 py-3 font-medium">Tài xế</th>
                <th className="px-4 py-3 font-medium text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {tripHistory.map((trip) => (
                <tr
                  key={trip.id}
                  className="border-t transition-colors duration-150 hover:bg-gray-50"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3 font-mono text-xs">{trip.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium">{trip.route ?? "-"}</td>
                  <td className="px-4 py-3">{formatDate(trip.completedDate)}</td>
                  <td className="px-4 py-3">{trip.vehiclePlate ?? "-"}</td>
                  <td className="px-4 py-3">{trip.driverName ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: "#22C55E" }}>
                    {formatVND(trip.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Trang {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        currentPage === page ? "text-white" : "border"
                      }`}
                      style={
                        currentPage === page
                          ? { backgroundColor: "#6366F1" }
                          : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                      }
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
