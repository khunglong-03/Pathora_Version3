"use client";

import { useMemo } from "react";

import Chart from "@/components/ui/Chart";
import type { AdminDashboard } from "@/types/admin";
import {
  createAreaOptions,
  createBarOptions,
  createDonutOptions,
  createLineOptions,
  formatMoney,
} from "../utils/chartOptions";
import ChartCard from "./ChartCard";
import TopToursTable from "./TopToursTable";
import { MetricLegend } from "./ui/MetricLegend";

const ACCENT = "#F97316";
const SUCCESS = "#10B981";
const PALETTE = [ACCENT, SUCCESS, "#EF4444", "#3B82F6", "#9CA3AF", "#F59E0B"] as const;

interface DashboardChartsProps {
  dashboard: AdminDashboard;
  t: (key: string) => string;
}

function normalizePointData(
  items: AdminDashboard["revenueOverTime"]
): AdminDashboard["revenueOverTime"] {
  return items.length > 0 ? items : [{ label: "", value: 0 }];
}

function normalizeCategoryData(
  items: AdminDashboard["revenueByTourType"]
): AdminDashboard["revenueByTourType"] {
  return items.length > 0 ? items : [{ label: "", value: 0 }];
}

export default function DashboardCharts({ dashboard, t }: DashboardChartsProps) {
  const revenueOverTime = useMemo(
    () => normalizePointData(dashboard.revenueOverTime),
    [dashboard.revenueOverTime]
  );

  const revenueByTourType = useMemo(
    () => normalizeCategoryData(dashboard.revenueByTourType),
    [dashboard.revenueByTourType]
  );

  const bookingTrend = useMemo(
    () => normalizePointData(dashboard.bookingTrend),
    [dashboard.bookingTrend]
  );

  const topDestinations = useMemo(
    () => normalizeCategoryData(dashboard.topDestinations),
    [dashboard.topDestinations]
  );

  const customerGrowth = useMemo(
    () => normalizePointData(dashboard.customerGrowth),
    [dashboard.customerGrowth]
  );

  const revenueOverTimeOptions = useMemo(
    () => createLineOptions(revenueOverTime.map((i) => i.label), formatMoney),
    [revenueOverTime]
  );
  const revenueOverTimeSeries = useMemo(
    () => [{ name: "Revenue", data: revenueOverTime.map((i) => Number(i.value)) }],
    [revenueOverTime]
  );

  const revenueByTourTypeOptions = useMemo(
    () => createDonutOptions(revenueByTourType.map((i) => i.label), [...PALETTE]),
    [revenueByTourType]
  );
  const revenueByTourTypeSeries = useMemo(
    () => revenueByTourType.map((i) => Number(i.value)),
    [revenueByTourType]
  );

  const bookingTrendOptions = useMemo(
    () => createAreaOptions(bookingTrend.map((i) => i.label)),
    [bookingTrend]
  );
  const bookingTrendSeries = useMemo(
    () => [{ name: "Bookings", data: bookingTrend.map((i) => Number(i.value)) }],
    [bookingTrend]
  );

  const topDestinationsOptions = useMemo(
    () => createBarOptions(topDestinations.map((i) => i.label), ACCENT),
    [topDestinations]
  );
  const topDestinationsSeries = useMemo(
    () => [{ name: "Bookings", data: topDestinations.map((i) => Number(i.value)) }],
    [topDestinations]
  );

  const customerGrowthOptions = useMemo(
    () => createBarOptions(customerGrowth.map((i) => i.label), SUCCESS),
    [customerGrowth]
  );
  const customerGrowthSeries = useMemo(
    () => [{ name: "New Customers", data: customerGrowth.map((i) => Number(i.value)) }],
    [customerGrowth]
  );

  return (
    <>
      {/* Row 3: Revenue line (8 cols) + Tour type donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard
          title={t("adminDashboard.chartRevenueOverTime")}
          period={t("adminDashboard.chartPeriodMonthly")}
          delay={0}
          className="lg:col-span-8"
        >
          <Chart options={revenueOverTimeOptions} series={revenueOverTimeSeries} type="line" height={240} />
        </ChartCard>
        <ChartCard title={t("adminDashboard.chartByTourType")} delay={1} className="lg:col-span-4">
          <div className="flex flex-col items-center mt-2">
            <Chart
              options={revenueByTourTypeOptions}
              series={revenueByTourTypeSeries}
              type="donut"
              height={160}
              width={160}
            />
            <div className="mt-4 w-full">
              <MetricLegend items={revenueByTourType} colors={PALETTE} />
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Booking trend (7 cols) + Top Tours table (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard
          title={t("adminDashboard.chartBookingTrend")}
          period={t("adminDashboard.chartPeriodMonthly")}
          delay={5}
          className="lg:col-span-7"
        >
          <Chart options={bookingTrendOptions} series={bookingTrendSeries} type="area" height={200} />
        </ChartCard>
        <ChartCard
          title={t("adminDashboard.chartTopSellingTours")}
          delay={6}
          className="lg:col-span-5"
        >
          <TopToursTable
            tours={dashboard.topTours}
            noDataText={t("adminDashboard.noTopTourData")}
            formatMoney={formatMoney}
            delay={6}
          />
        </ChartCard>
      </div>

      {/* Row 6: Destinations (4 cols) + Customer Growth (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <ChartCard title={t("adminDashboard.chartTopDestinations")} delay={7} className="lg:col-span-4">
          <Chart
            options={topDestinationsOptions}
            series={topDestinationsSeries}
            type="bar"
            height={180}
          />
        </ChartCard>
        <ChartCard
          title={t("adminDashboard.chartCustomerGrowth")}
          period={t("adminDashboard.chartPeriodMonthly")}
          delay={8}
          className="lg:col-span-8"
        >
          <Chart
            options={customerGrowthOptions}
            series={customerGrowthSeries}
            type="bar"
            height={180}
          />
        </ChartCard>
      </div>
    </>
  );
}

export { DashboardCharts };
