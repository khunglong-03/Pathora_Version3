import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminBooking } from "@/api/services/adminService";
import { BookingsTable } from "../bookings/ui/BookingsTable";
import { buildStatCards } from "../bookings/ui/BookingsStatCards";

const t = (key: string) => key;

describe("dashboard bookings currency", () => {
  it("formats booking table amounts as VND", () => {
    const bookings: AdminBooking[] = [
      {
        id: "booking-1",
        customerName: "Nguyen Van A",
        tourName: "Ha Long Bay",
        departureDate: "2026-05-10",
        amount: 2500000,
        status: "confirmed",
      },
    ];

    const { container } = render(<BookingsTable bookings={bookings} t={t} />);

    expect(screen.getAllByText(/2\.500\.000/).length).toBeGreaterThan(0);
    expect(container.textContent).toContain("₫");
    expect(container.textContent).not.toContain("$");
  });

  it("formats total revenue stat as VND", () => {
    const cards = buildStatCards(t, false, [], 0, 0, 12500000);
    const totalRevenue = cards.find((card) => card.label === "bookings.stat.totalRevenue");

    expect(totalRevenue?.value).toContain("₫");
    expect(totalRevenue?.value).not.toContain("$");
  });
});
