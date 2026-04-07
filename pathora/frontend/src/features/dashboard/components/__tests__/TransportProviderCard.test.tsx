import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { TransportProviderCard } from "../TransportProviderCard";
import type { TransportProviderListItem } from "@/types/admin";

const renderComponent = (props: React.ComponentProps<typeof TransportProviderCard>) => {
  return render(<TransportProviderCard {...props} />);
};

describe("TransportProviderCard", () => {
  const mockProvider: TransportProviderListItem = {
    id: "tp1",
    name: "Vietransport Co.",
    email: "contact@vietransport.com",
    phone: "0909123456",
    status: "Active",
    bookingCount: 45,
    vehicleCount: 12,
  };

  it("renders provider card", () => {
    renderComponent({ provider: mockProvider });

    const card = screen.getByTestId("transport-provider-card");
    expect(card).toBeInTheDocument();
  });

  it("renders name, email, phone", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("Vietransport Co.")).toBeInTheDocument();
    expect(screen.getByText("contact@vietransport.com")).toBeInTheDocument();
    expect(screen.getByText("0909123456")).toBeInTheDocument();
  });

  it("renders booking count stat", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("Đặt xe")).toBeInTheDocument();
  });

  it("renders vehicle count stat", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Phương tiện")).toBeInTheDocument();
  });

  it("renders booking count as zero when not provided", () => {
    const noBookingProvider = { ...mockProvider, bookingCount: undefined };
    renderComponent({ provider: noBookingProvider });

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders active status badge", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("Hoạt động")).toBeInTheDocument();
  });

  it("renders inactive status badge", () => {
    const inactiveProvider = { ...mockProvider, status: "Inactive" };
    renderComponent({ provider: inactiveProvider });

    expect(screen.getByText("Ngừng")).toBeInTheDocument();
  });

  it("has hover lift animation via transition class", () => {
    renderComponent({ provider: mockProvider });

    const card = screen.getByTestId("transport-provider-card");
    expect(card.className).toMatch(/transition/);
  });

  it("has diffusion shadow applied", () => {
    renderComponent({ provider: mockProvider });

    const card = screen.getByTestId("transport-provider-card");
    expect(card.getAttribute("style") || "").toMatch(/shadow/);
  });

  it("handles provider without optional fields", () => {
    const minimalProvider: TransportProviderListItem = { id: "tp2", name: "Min Transport", status: "Inactive" };
    renderComponent({ provider: minimalProvider });

    expect(screen.getByText("Min Transport")).toBeInTheDocument();
  });

  it("renders address when provided", () => {
    const providerWithAddress: TransportProviderListItem = {
      ...mockProvider,
      address: "123 Đường ABC, Quận 1, TP.HCM",
    };
    renderComponent({ provider: providerWithAddress });

    expect(screen.getByText("123 Đường ABC, Quận 1, TP.HCM")).toBeInTheDocument();
  });
});
