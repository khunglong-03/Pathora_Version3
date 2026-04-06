import type { ApexOptions } from "apexcharts";

const TEXT_MUTED = "#9CA3AF";
const BORDER_SUB = "#E5E7EB";
const ACCENT = "#F97316";

export function createLineOptions(
  categories: string[],
  yFormatter: (v: number) => string
): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      background: "transparent",
      sparkline: { enabled: false },
    },
    theme: { mode: "light" },
    stroke: { curve: "smooth", width: 2 },
    colors: [ACCENT],
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: yFormatter,
        style: { colors: TEXT_MUTED },
      },
    },
    grid: {
      borderColor: BORDER_SUB,
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    fill: { opacity: 1 },
    tooltip: {
      theme: "light",
      y: { formatter: yFormatter },
    },
    plotOptions: {},
    legend: { show: false },
  };
}

export function createAreaOptions(categories: string[]): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      background: "transparent",
      sparkline: { enabled: false },
    },
    theme: { mode: "light" },
    stroke: { curve: "smooth", width: 2 },
    colors: [ACCENT],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: TEXT_MUTED } },
    },
    grid: {
      borderColor: BORDER_SUB,
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    tooltip: { theme: "light" },
    legend: { show: false },
  };
}

export function createBarOptions(categories: string[], color: string): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      background: "transparent",
      sparkline: { enabled: false },
    },
    theme: { mode: "light" },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    colors: [color],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { colors: TEXT_MUTED } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: TEXT_MUTED } },
    },
    grid: {
      borderColor: BORDER_SUB,
      strokeDashArray: 4,
    },
    fill: { opacity: 1 },
    tooltip: { theme: "light" },
    legend: { show: false },
  };
}

export function createDonutOptions(labels: string[], colors: string[]): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      background: "transparent",
      sparkline: { enabled: false },
      type: "donut",
    },
    theme: { mode: "light" },
    colors,
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true, color: TEXT_MUTED },
            value: {
              show: true,
              color: TEXT_MUTED,
              formatter: (val: string) => val,
            },
            total: {
              show: true,
              label: "Total",
              color: TEXT_MUTED,
              formatter: () => "",
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
    tooltip: {
      theme: "light",
    },
    fill: { type: "solid" },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: "100%" },
          legend: { position: "bottom" },
        },
      },
    ],
  };
}

export function formatMoney(value: number): string {
  return "$" + Math.round(value).toLocaleString();
}
