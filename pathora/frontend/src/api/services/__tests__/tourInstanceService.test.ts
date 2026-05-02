import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("@/api/axiosInstance", () => ({
  api: {
    get: getMock,
    post: postMock,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/utils/apiResponse", () => ({
  extractResult: (data: unknown) => data,
}));

import {
  CreateTourInstancePayload,
  UpdateTourInstancePayload,
  tourInstanceService,
} from "../tourInstanceService";

describe("tourInstanceService.getAllInstances", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("rethrows 401 failures with the HTTP status attached", async () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 401,
      },
    };
    getMock.mockRejectedValue(error);

    await expect(tourInstanceService.getAllInstances()).rejects.toMatchObject({
      status: 401,
      response: {
        status: 401,
      },
    });
  });
});

describe("CreateTourInstancePayload", () => {
  it("uses Public (2) for default creation flow", () => {
    const payload: CreateTourInstancePayload = {
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "Default Visibility Test",
      instanceType: 2,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1500000,
    };

    expect(payload.instanceType).toBe(2);
  });

  it("supports optional guideUserIds and omits managerUserIds", () => {
    const payload: CreateTourInstancePayload = {
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "Ha Long June Departure",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1500000,
      guideUserIds: ["user-guide-1"],
      includedServices: ["shuttle", "meals"],
    };

    expect(payload.guideUserIds).toEqual(["user-guide-1"]);
    expect((payload as { managerUserIds?: string[] }).managerUserIds).toBeUndefined();
  });

  it("supports create payload without guideUserIds", () => {
    const payload: CreateTourInstancePayload = {
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "No Guide Assigned",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1500000,
      includedServices: ["insurance"],
    };

    expect(payload.guideUserIds).toBeUndefined();
    expect(payload.includedServices).toEqual(["insurance"]);
  });

  it("includes required pricing fields", () => {
    const payload: CreateTourInstancePayload = {
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "Price Test",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1500000,
    };

    expect(payload.basePrice).toBe(1500000);
    expect(payload.maxParticipation).toBe(20);
  });

  it("supports transportation plan fields on activity assignments", () => {
    const payload: CreateTourInstancePayload = {
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "Transport Plan Test",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1500000,
      activityAssignments: [
        {
          originalActivityId: "activity-1",
          supplierId: "supplier-1",
          requestedVehicleType: 1,
          requestedSeatCount: 24,
        },
      ],
    };

    expect(payload.activityAssignments?.[0]).toMatchObject({
      supplierId: "supplier-1",
      requestedVehicleType: 1,
      requestedSeatCount: 24,
    });

  });
});

describe("tourInstanceService.createInstance", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue({ data: { id: "instance-123" } });
  });

  it("posts per-activity transport assignments without legacy properties", async () => {
    await tourInstanceService.createInstance({
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "  Northern Escape  ",
      instanceType: 1,
      startDate: "2025-07-01T00:00:00Z",
      endDate: "2025-07-03T00:00:00Z",
      maxParticipation: 20,
      basePrice: 1500000,
      includedServices: [" shuttle ", "meals"],
      guideUserIds: ["guide-1"],
      thumbnailUrl: "https://example.com/thumb.jpg",
      imageUrls: [" https://example.com/1.jpg ", "https://example.com/2.jpg"],
      activityAssignments: [
        {
          originalActivityId: "activity-transport-1",
          supplierId: "transport-supplier-1",
          requestedVehicleType: 1,
          requestedSeatCount: 24,
        },
      ],
    });

    expect(postMock).toHaveBeenCalledTimes(1);

    const [, submittedPayload] = postMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(submittedPayload).toMatchObject({
      tourId: "tour-123",
      classificationId: "cls-456",
      title: "Northern Escape",
      includedServices: ["shuttle", "meals"],
      guideUserIds: ["guide-1"],
      thumbnailUrl: "https://example.com/thumb.jpg",
      imageUrls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      activityAssignments: [
        {
          originalActivityId: "activity-transport-1",
          supplierId: "transport-supplier-1",
          requestedVehicleType: 1,
          requestedSeatCount: 24,
        },
      ],
    });

  });
});

describe("UpdateTourInstancePayload", () => {
  it("supports optional instanceType for update flow", () => {
    const payload: UpdateTourInstancePayload = {
      id: "instance-789",
      title: "Updated Title",
      instanceType: 2,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 25,
      basePrice: 1500000,
    };

    expect(payload.instanceType).toBe(2);
  });

  it("still supports guideUserIds and managerUserIds for update flow", () => {
    const payload: UpdateTourInstancePayload = {
      id: "instance-789",
      title: "Updated Title",
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 25,
      basePrice: 1500000,
      guideUserIds: ["user-guide-1"],
      managerUserIds: ["user-mgr-1", "user-mgr-2"],
    };

    expect(payload.guideUserIds).toEqual(["user-guide-1"]);
    expect(payload.managerUserIds).toEqual(["user-mgr-1", "user-mgr-2"]);
  });
});
