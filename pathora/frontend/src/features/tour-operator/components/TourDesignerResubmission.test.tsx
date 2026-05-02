import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  pushMock,
  getTourDetailMock,
  updateTourMock,
  toastSuccessMock,
  toastErrorMock,
  useTourOperatorTourListMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  getTourDetailMock: vi.fn(),
  updateTourMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  useTourOperatorTourListMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-1" }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@phosphor-icons/react", () => ({
  PlusIcon: () => <span data-testid="mock-icon-plus">PlusIcon</span>,
  MagnifyingGlassIcon: () => <span data-testid="mock-icon-search">MagnifyingGlassIcon</span>,
  MapTrifoldIcon: () => <span data-testid="mock-icon-map">MapTrifoldIcon</span>,
  CaretRightIcon: () => <span data-testid="mock-icon-caret-right">CaretRightIcon</span>,
  WarningCircleIcon: () => <span data-testid="mock-icon-warning-circle">WarningCircleIcon</span>,
  ImageSquareIcon: () => <span data-testid="mock-icon-image-square">ImageSquareIcon</span>,
  PencilSimple: () => <span data-testid="mock-icon-pencil">PencilSimple</span>,
  EyeIcon: () => <span data-testid="mock-icon-eye">EyeIcon</span>,
}));

vi.mock("@/api/services/tourService", () => ({
  tourService: {
    getTourDetail: getTourDetailMock,
    updateTour: updateTourMock,
  },
}));

vi.mock("../hooks/useTourOperatorTourList", () => ({
  useTourOperatorTourList: useTourOperatorTourListMock,
}));

vi.mock("@/features/dashboard/components/TourForm", () => ({
  default: ({
    onSubmit,
    initialData,
  }: {
    onSubmit: (formData: FormData) => Promise<void>;
    initialData?: { status?: number | string };
  }) => (
    <button
      type="button"
      data-testid="mock-tour-form-submit"
      onClick={() => {
        const formData = new FormData();
        formData.append("status", String(initialData?.status ?? ""));
        void onSubmit(formData);
      }}
    >
      submit
    </button>
  ),
}));

import { TourOperatorTourDetailPage } from "./TourOperatorTourDetailPage";
import { TourOperatorTourEditWrapper } from "./TourOperatorTourEditWrapper";
import { TourOperatorTourListPage } from "./TourOperatorTourListPage";
import { TourFormPage } from "./TourFormPage";

const rejectedDetailTour = {
  id: "tour-1",
  tourCode: "TOUR-001",
  tourName: "Rejected Tour",
  shortDescription: "Needs revision",
  longDescription: "Rejected by manager",
  status: 4,
  tourScope: 1,
  customerSegment: 2,
  seoTitle: null,
  seoDescription: null,
  isDeleted: false,
  thumbnail: { publicURL: null },
  images: [],
  classifications: [],
  createdBy: null,
  createdOnUtc: "2026-04-18T00:00:00Z",
  lastModifiedBy: null,
  lastModifiedOnUtc: null,
  translations: null,
  services: null,
} as any;

const activeDetailTour = {
  ...rejectedDetailTour,
  id: "tour-2",
  tourName: "Active Tour",
  status: 1,
};

describe("TourOperator resubmission flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTourDetailMock.mockResolvedValue(rejectedDetailTour);
    updateTourMock.mockResolvedValue(undefined);
    useTourOperatorTourListMock.mockReturnValue({
      tours: [
        {
          id: "tour-1",
          tourCode: "TOUR-001",
          tourName: "Rejected Tour",
          shortDescription: "Needs revision",
          status: "4",
          thumbnail: null,
          createdOnUtc: "2026-04-18T00:00:00Z",
        },
      ],
      total: 1,
      state: "ready",
      errorMessage: null,
      refetch: vi.fn(),
    });
  });

  it("shows the edit action for rejected tours in the TourOperator list", async () => {
    render(<TourOperatorTourListPage />);

    await waitFor(() => {
      expect(screen.getByText("Rejected Tour")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Edit/ })).toHaveAttribute(
      "href",
      "/tour-operator/tours/tour-1/edit",
    );
  });

  it("shows the edit action for rejected tours in the TourOperator detail page", async () => {
    render(<TourOperatorTourDetailPage />);

    await waitFor(() => {
      expect(getTourDetailMock).toHaveBeenCalledWith("tour-1");
    });

    expect(screen.getByRole("link", { name: /Edit/ })).toHaveAttribute(
      "href",
      "/tour-operator/tours/tour-1/edit",
    );
  });

  it("allows the TourOperator edit wrapper to open rejected tours", async () => {
    render(<TourOperatorTourEditWrapper />);

    await waitFor(() => {
      expect(getTourDetailMock).toHaveBeenCalledWith("tour-1");
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("forces rejected tour updates back to pending before calling updateTour", async () => {
    render(
      <TourFormPage
        mode="edit"
        initialData={rejectedDetailTour}
        existingImages={[]}
        showPolicySections={false}
      />,
    );

    fireEvent.click(screen.getByTestId("mock-tour-form-submit"));

    await waitFor(() => {
      expect(updateTourMock).toHaveBeenCalledTimes(1);
    });

    const submittedFormData = updateTourMock.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("status")).toBe("3");
  });
});

describe("TourOperator active tour edits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTourDetailMock.mockResolvedValue(activeDetailTour);
    updateTourMock.mockResolvedValue(undefined);
    useTourOperatorTourListMock.mockReturnValue({
      tours: [
        {
          id: "tour-2",
          tourCode: "TOUR-002",
          tourName: "Active Tour",
          shortDescription: "Currently active",
          status: "1",
          thumbnail: null,
          createdOnUtc: "2026-04-18T00:00:00Z",
        },
      ],
      total: 1,
      state: "ready",
      errorMessage: null,
      refetch: vi.fn(),
    });
  });

  it("shows the edit action for active tours in the TourOperator list", async () => {
    render(<TourOperatorTourListPage />);

    await waitFor(() => {
      expect(screen.getByText("Active Tour")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Edit/ })).toHaveAttribute(
      "href",
      "/tour-operator/tours/tour-2/edit",
    );
  });

  it("shows the edit action for active tours in the TourOperator detail page", async () => {
    render(<TourOperatorTourDetailPage />);

    await waitFor(() => {
      expect(getTourDetailMock).toHaveBeenCalledWith("tour-1");
    });

    expect(screen.getByRole("link", { name: /Edit/ })).toHaveAttribute(
      "href",
      "/tour-operator/tours/tour-1/edit",
    );
  });

  it("allows the TourOperator edit wrapper to open active tours", async () => {
    render(<TourOperatorTourEditWrapper />);

    await waitFor(() => {
      expect(getTourDetailMock).toHaveBeenCalledWith("tour-1");
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("forces active tour updates back to pending before calling updateTour", async () => {
    render(
      <TourFormPage
        mode="edit"
        initialData={activeDetailTour}
        existingImages={[]}
        showPolicySections={false}
      />,
    );

    fireEvent.click(screen.getByTestId("mock-tour-form-submit"));

    await waitFor(() => {
      expect(updateTourMock).toHaveBeenCalledTimes(1);
    });

    const submittedFormData = updateTourMock.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("status")).toBe("3");
  });
});
