import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingStatusListener } from "../useBookingStatusListener";
import { signalRService, type BookingStatusChangedEvent } from "@/api/services/signalRService";
import { apiSlice } from "@/store/api/apiSlice";

const dispatchMock = vi.fn();
let statusHandler: ((event: BookingStatusChangedEvent) => void) | undefined;

vi.mock("react-redux", () => ({
  useDispatch: () => dispatchMock,
}));

vi.mock("@/store/api/apiSlice", () => ({
  apiSlice: {
    util: {
      invalidateTags: vi.fn((tags: string[]) => ({ type: "invalidateTags", payload: tags })),
    },
  },
}));

vi.mock("@/api/services/signalRService", () => ({
  signalRService: {
    connect: vi.fn(() => Promise.resolve()),
    onBookingStatusChanged: vi.fn((handler: (event: BookingStatusChangedEvent) => void) => {
      statusHandler = handler;
      return vi.fn();
    }),
  },
}));

function ListenerProbe({ onStatusChanged }: { onStatusChanged?: (event: BookingStatusChangedEvent) => void }) {
  useBookingStatusListener(onStatusChanged);
  return <div>listener-ready</div>;
}

describe("useBookingStatusListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchMock.mockClear();
    statusHandler = undefined;
  });

  it("connects to SignalR when mounted", async () => {
    render(<ListenerProbe />);

    await waitFor(() => {
      expect(signalRService.connect).toHaveBeenCalledTimes(1);
      expect(signalRService.onBookingStatusChanged).toHaveBeenCalledTimes(1);
    });
  });

  it("invalidates booking list data and forwards booking status events", async () => {
    const onStatusChanged = vi.fn();
    render(<ListenerProbe onStatusChanged={onStatusChanged} />);

    await waitFor(() => expect(statusHandler).toBeDefined());

    const event = {
      bookingId: "booking-1",
      newStatus: "Cancelled",
      paidAmount: 0,
      remainingBalance: 0,
    };
    statusHandler?.(event);

    expect(apiSlice.util.invalidateTags).toHaveBeenCalledWith(["Orders"]);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "invalidateTags", payload: ["Orders"] });
    expect(onStatusChanged).toHaveBeenCalledWith(event);
  });
});
