import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AdminKpiStrip } from "../AdminKpiStrip";

const renderComponent = (props: React.ComponentProps<typeof AdminKpiStrip>) => {
  return render(<AdminKpiStrip {...props} />);
};

describe("AdminKpiStrip", () => {
  const kpis = [
    { label: "Tổng người dùng", value: "150", icon: "Users", accent: "#C9873A" },
    { label: "Đang hoạt động", value: "120", icon: "CheckCircle", accent: "#22C55E" },
    { label: "Đã khóa", value: "30", icon: "XCircle", accent: "#EF4444" },
  ];

  it("renders all KPI labels and values", () => {
    renderComponent({ kpis });

    expect(screen.getByText("Tổng người dùng")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Đã khóa")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    renderComponent({
      kpis: [{ label: "Revenue", value: "$10K", icon: "Currency", accent: "#C9873A", subtext: "+15% this month" }],
    });

    expect(screen.getByText("+15% this month")).toBeInTheDocument();
  });

  it("renders correct number of KPI cards", () => {
    renderComponent({ kpis });

    const cards = document.body.querySelectorAll("[data-testid]");
    const kpiCards = Array.from(cards).filter((el) => el.getAttribute("data-testid")?.startsWith("kpi-card-"));
    expect(kpiCards).toHaveLength(3);
  });

  it("handles empty KPI array", () => {
    renderComponent({ kpis: [] });

    expect(document.body.textContent).toBe("");
  });

  it("renders single KPI", () => {
    renderComponent({
      kpis: [{ label: "Total", value: "100", icon: "Star", accent: "#C9873A" }],
    });

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
