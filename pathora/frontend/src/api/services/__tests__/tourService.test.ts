import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";

import { mapTourVmToSearchTour, normalizeTourListResponse, normalizeTourStatus } from "../tourMappers";
import { tourService } from "../tourService";

vi.mock("@/api/axiosInstance", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("normalizeTourListResponse", () => {
  it("normalizes list payload into canonical tour model", async () => {
    const result = normalizeTourListResponse({
      total: 1,
      data: [
        {
          id: "tour-1",
          tourCode: "TOUR-001",
          tourName: "Da Nang",
          shortDescription: null,
          status: "archived",
          thumbnail: {
            fileId: "thumb-1",
            originalFileName: "thumb.jpg",
            fileName: "thumb.jpg",
            publicURL: " https://cdn.pathora.test/thumb.jpg ",
          },
          createdOnUtc: "2026-03-12T10:00:00Z",
        },
      ],
    });

    expect(result.data[0]).toEqual({
      id: "tour-1",
      tourCode: "TOUR-001",
      tourName: "Da Nang",
      shortDescription: "",
      status: "Unknown",
      thumbnail: {
        fileId: "thumb-1",
        originalFileName: "thumb.jpg",
        fileName: "thumb.jpg",
        publicURL: "https://cdn.pathora.test/thumb.jpg",
      },
      createdOnUtc: "2026-03-12T10:00:00Z",
    });
  });
});

describe("normalizeTourStatus", () => {
  it("normalizes known lowercase status to title case", () => {
    expect(normalizeTourStatus("active")).toBe("Active");
    expect(normalizeTourStatus("pending")).toBe("Pending");
    expect(normalizeTourStatus("draft")).toBe("Draft");
    expect(normalizeTourStatus("inactive")).toBe("Inactive");
    expect(normalizeTourStatus("rejected")).toBe("Rejected");
  });

  it("handles uppercase and mixed case status strings", () => {
    expect(normalizeTourStatus("ACTIVE")).toBe("Active");
    expect(normalizeTourStatus("Pending")).toBe("Pending");
    expect(normalizeTourStatus("  ACTIVE  ")).toBe("Active");
  });

  it("returns Unknown for unrecognized status", () => {
    expect(normalizeTourStatus("archived")).toBe("Unknown");
    expect(normalizeTourStatus("published")).toBe("Unknown");
    expect(normalizeTourStatus("")).toBe("Unknown");
    expect(normalizeTourStatus(null)).toBe("Unknown");
    expect(normalizeTourStatus(undefined)).toBe("Unknown");
    expect(normalizeTourStatus("  ")).toBe("Unknown");
  });
});

describe("mapTourVmToSearchTour", () => {
  it("maps TourVm fields to SearchTour correctly", () => {
    const tourVm = {
      id: "tour-1",
      tourCode: "TOUR-001",
      tourName: "Da Nang Beach Tour",
      shortDescription: "Beach vacation",
      status: "active",
      thumbnail: {
        fileId: "thumb-1",
        originalFileName: "thumb.jpg",
        fileName: "thumb.jpg",
        publicURL: "https://cdn.example.com/thumb.jpg",
      },
      createdOnUtc: "2026-03-23T10:00:00Z",
    };

    const result = mapTourVmToSearchTour(tourVm);

    expect(result.id).toBe("tour-1");
    expect(result.tourName).toBe("Da Nang Beach Tour");
    expect(result.thumbnail).toBe("https://cdn.example.com/thumb.jpg");
    expect(result.shortDescription).toBe("Beach vacation");
    expect(result.location).toBeNull();
    expect(result.durationDays).toBe(0);
    expect(result.price).toBe(0);
    expect(result.salePrice).toBe(0);
    expect(result.classificationName).toBeNull();
    expect(result.rating).toBeNull();
  });

  it("handles null thumbnail by mapping to null URL", () => {
    const tourVm = {
      id: "tour-1",
      tourCode: "TOUR-001",
      tourName: "Tour",
      shortDescription: "",
      status: "active",
      thumbnail: null,
      createdOnUtc: "2026-03-23T10:00:00Z",
    };

    const result = mapTourVmToSearchTour(tourVm);

    expect(result.thumbnail).toBeNull();
  });
});

describe("tourService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the admin tour management API route with the backend base path", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        result: {
          total: 1,
          data: [{ id: "tour-1", tourName: "Ha Long Bay" }],
        },
      },
    } as never);

    await tourService.getAdminTourManagement("ha long", "active", 2, 25);

    expect(api.get).toHaveBeenCalledWith(
      "/api/admin/tour-management?searchText=ha+long&pageNumber=2&pageSize=25&status=active",
    );
  });
});
