import { describe, expect, it } from "vitest";
import {
  CreateTourInstancePayload,
  UpdateTourInstancePayload,
} from "../tourInstanceService";

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
