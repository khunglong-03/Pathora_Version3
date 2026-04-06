"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

type ChartProps = {
  options: ApexOptions;
  series: ApexOptions["series"];
  type: ApexOptions["chart"]["type"];
  height?: number | string;
  width?: number | string;
};

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Chart({ options, series, type, height = 350, width = "100%" }: ChartProps) {
  return <ApexChart options={options} series={series} type={type} height={height} width={width} />;
}