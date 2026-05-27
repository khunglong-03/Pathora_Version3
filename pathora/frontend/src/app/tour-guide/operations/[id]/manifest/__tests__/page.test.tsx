import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TourGuideManifestPage from "../page";
import { tourGuideManifestService } from "@/api/services/tourGuideManifestService";
import { useSelector } from "react-redux";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-instance-123" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  notFound: vi.fn(),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

// Mock react-redux
vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

// Mock the api service
vi.mock("@/api/services/tourGuideManifestService", () => ({
  tourGuideManifestService: {
    getManifest: vi.fn(),
  },
}));

// Mock phosphor icons to avoid rendering complexities and missing icon errors
vi.mock("@phosphor-icons/react", () => {
  const dummyIcon = (name: string) => {
    const Component = (props: any) => <span data-testid={`icon-${name}`}>{name}</span>;
    Component.displayName = name;
    return Component;
  };
  return {
    SquaresFourIcon: dummyIcon("SquaresFourIcon"),
    GlobeHemisphereWestIcon: dummyIcon("GlobeHemisphereWestIcon"),
    CalendarDotsIcon: dummyIcon("CalendarDotsIcon"),
    ClipboardTextIcon: dummyIcon("ClipboardTextIcon"),
    TicketIcon: dummyIcon("TicketIcon"),
    CreditCardIcon: dummyIcon("CreditCardIcon"),
    UsersThreeIcon: dummyIcon("UsersThreeIcon"),
    ShieldCheckIcon: dummyIcon("ShieldCheckIcon"),
    CertificateIcon: dummyIcon("CertificateIcon"),
    GearIcon: dummyIcon("GearIcon"),
    XIcon: dummyIcon("XIcon"),
    XCircleIcon: dummyIcon("XCircleIcon"),
    ListIcon: dummyIcon("ListIcon"),
    BellIcon: dummyIcon("BellIcon"),
    BuildingsIcon: dummyIcon("BuildingsIcon"),
    VanIcon: dummyIcon("VanIcon"),
    BedIcon: dummyIcon("BedIcon"),
    PaintBrushIcon: dummyIcon("PaintBrushIcon"),
    TruckIcon: dummyIcon("TruckIcon"),
    CarIcon: dummyIcon("CarIcon"),
    ListChecksIcon: dummyIcon("ListChecksIcon"),
    BuildingOfficeIcon: dummyIcon("BuildingOfficeIcon"),
    HouseIcon: dummyIcon("HouseIcon"),
    PlusIcon: dummyIcon("PlusIcon"),
    HandCoinsIcon: dummyIcon("HandCoinsIcon"),
    CaretLeftIcon: dummyIcon("CaretLeftIcon"),
    PrinterIcon: dummyIcon("PrinterIcon"),
    MagnifyingGlassIcon: dummyIcon("MagnifyingGlassIcon"),
    WarningCircleIcon: dummyIcon("WarningCircleIcon"),
    IdentificationCardIcon: dummyIcon("IdentificationCardIcon"),
  };
});

// Mock featureFlags configuration
vi.mock("@/configs/featureFlags", () => ({
  featureFlags: {
    enableGuideManifest: true,
  },
}));

const mockManifestData = {
  tourInstanceId: "tour-instance-123",
  generatedAt: new Date().toISOString(),
  bookings: [
    {
      bookingId: "booking-1",
      reference: "PATH-2026-0001",
      adults: 2,
      children: 1,
      infants: 0,
      participants: [
        {
          participantId: "part-1",
          fullName: "Alice Smith",
          participantType: "Adult",
          dateOfBirth: "1990-05-15T00:00:00.000Z",
          gender: "Female",
          nationality: "USA",
        },
        {
          participantId: "part-2",
          fullName: "Bob Smith",
          participantType: "Adult",
          dateOfBirth: "1988-10-20T00:00:00.000Z",
          gender: "Male",
          nationality: "USA",
        },
        {
          participantId: "part-3",
          fullName: "Charlie Smith",
          participantType: "Child",
          dateOfBirth: "2018-03-12T00:00:00.000Z",
          gender: "Male",
          nationality: "USA",
        },
      ],
    },
    {
      bookingId: "booking-2",
      reference: "PATH-2026-0002",
      adults: 1,
      children: 0,
      infants: 0,
      participants: [
        {
          participantId: "part-4",
          fullName: "David Miller",
          participantType: "Adult",
          dateOfBirth: "1975-07-30T00:00:00.000Z",
          gender: "Male",
          nationality: "Germany",
        },
      ],
    },
  ],
};

describe("TourGuideManifestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSelector).mockReturnValue({
      id: "guide-1",
      fullName: "Jane Doe",
    });
  });

  it("renders layout correctly with headers and search input", async () => {
    vi.mocked(tourGuideManifestService.getManifest).mockResolvedValue(mockManifestData);

    render(<TourGuideManifestPage />);

    // Loader is shown first
    expect(screen.getByText("Đang tải dữ liệu hành khách...")).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText("PATH-2026-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("Charlie Smith")).toBeInTheDocument();
    expect(screen.getByText("David Miller")).toBeInTheDocument();

    // Check displaying watermark text
    expect(screen.getAllByText(/Jane Doe/i).length).toBeGreaterThan(0);
  });

  it("filters passengers based on search keyword", async () => {
    vi.mocked(tourGuideManifestService.getManifest).mockResolvedValue(mockManifestData);

    render(<TourGuideManifestPage />);

    await waitFor(() => {
      expect(screen.getByText("PATH-2026-0001")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Tìm theo tên hành khách hoặc mã booking...");

    // Type name
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    // Wait for debounce (300ms)
    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument();
      expect(screen.queryByText("David Miller")).not.toBeInTheDocument();
    });

    // Type booking reference
    fireEvent.change(searchInput, { target: { value: "PATH-2026-0002" } });

    await waitFor(() => {
      expect(screen.getByText("David Miller")).toBeInTheDocument();
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });
  });

  it("handles 403 Forbidden by rendering Access Denied fallback UI", async () => {
    const forbiddenError = {
      response: {
        status: 403,
      },
    };
    vi.mocked(tourGuideManifestService.getManifest).mockRejectedValue(forbiddenError);

    render(<TourGuideManifestPage />);

    await waitFor(() => {
      expect(screen.getByText("Từ chối truy cập")).toBeInTheDocument();
    });
  });
});
