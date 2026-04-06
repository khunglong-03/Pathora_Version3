import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { HotelProviderCard } from "../HotelProviderCard";
import type { HotelProviderListItem } from "@/types/admin";

const renderComponent = (props: React.ComponentProps<typeof HotelProviderCard>) => {
  return render(<HotelProviderCard {...props} />);
};

describe("HotelProviderCard", () => {
  const mockProvider: HotelProviderListItem = {
    id: "hp1",
    name: "Grand Hotel Saigon",
    email: "reservations@grandhotel.vn",
    phone: "0912345678",
    status: "Active",
    accommodationCount: 3,
    roomCount: 250,
  };

  it("renders provider card", () => {
    renderComponent({ provider: mockProvider });

    const card = screen.getByTestId("hotel-provider-card");
    expect(card).toBeInTheDocument();
  });

  it("renders name, email, phone", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("Grand Hotel Saigon")).toBeInTheDocument();
    expect(screen.getByText("reservations@grandhotel.vn")).toBeInTheDocument();
    expect(screen.getByText("0912345678")).toBeInTheDocument();
  });

  it("renders accommodation count stat", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Cơ sở lưu trú")).toBeInTheDocument();
  });

  it("renders room count stat", () => {
    renderComponent({ provider: mockProvider });

    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("Phòng")).toBeInTheDocument();
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

    const card = screen.getByTestId("hotel-provider-card");
    expect(card.className).toMatch(/transition/);
  });

  it("has diffusion shadow applied", () => {
    renderComponent({ provider: mockProvider });

    const card = screen.getByTestId("hotel-provider-card");
    expect(card.getAttribute("style") || "").toMatch(/shadow/);
  });

  it("handles provider without optional fields", () => {
    const minimalProvider: HotelProviderListItem = { id: "hp2", name: "Budget Inn", status: "Inactive" };
    renderComponent({ provider: minimalProvider });

    expect(screen.getByText("Budget Inn")).toBeInTheDocument();
  });
});
