import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { TourInstanceListPage } from "../TourInstanceListPage";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("react-i18next", () => {
  const t = (_key: string, fallback?: string) => fallback ?? _key;

  return {
    useTranslation: () => ({ t }),
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn(),
    },
  };
});

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
  TourStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  getTourInstanceRequestStatus: (error: unknown) => {
    const requestError = error as {
      status?: number;
      response?: { status?: number };
    };
    return requestError.response?.status ?? requestError.status;
  },
  tourInstanceService: {
    getAllInstances: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock("../AdminSidebar", () => ({
  AdminSidebar: () => <aside data-testid="admin-sidebar" />,
  TopBar: () => <header data-testid="top-bar" />,
}));

describe("TourInstanceListPage", () => {
  const getAllInstancesMock = vi.mocked(tourInstanceService.getAllInstances);
  const getStatsMock = vi.mocked(tourInstanceService.getStats);
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getAllInstancesMock.mockReset();
    getStatsMock.mockReset();
    getStatsMock.mockResolvedValue(null);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders auth failure as an error state instead of the empty state", async () => {
    getAllInstancesMock.mockRejectedValue({
      status: 401,
      response: {
        status: 401,
      },
    });

    render(<TourInstanceListPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Your session does not have access to these tour instances. Please sign in again.",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("No scheduled instances")).not.toBeInTheDocument();
  });
});
