declare module "react-apexcharts" {
  import { ComponentType } from "react";

  interface ApexOptions {
    [key: string]: unknown;
  }

  interface Props {
    options?: ApexOptions;
    series?: unknown[];
    type?:
      | "line"
      | "area"
      | "bar"
      | "pie"
      | "donut"
      | "radialBar"
      | "scatter"
      | "bubble"
      | "heatmap"
      | "candlestick"
      | "boxPlot"
      | "radar"
      | "polarArea"
      | "rangeBar"
      | "treemap";
    width?: string | number;
    height?: string | number;
    [key: string]: unknown;
  }

  const ReactApexChart: ComponentType<Props>;
  export default ReactApexChart;
}
