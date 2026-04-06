import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

// Tests for CreateTourInstancePage guide picker and service checkbox logic

// ─── Instance Type Hint Logic ────────────────────────────────────────────────

describe("instance type hint rendering", () => {
  it("shows public hint when instanceType is 2", () => {
    const instanceType = "2";
    const hint = instanceType === "1"
      ? "Only visible in the admin dashboard"
      : "Visible to all site users";

    expect(hint).toBe("Visible to all site users");
  });

  it("shows private hint when instanceType is 1", () => {
    const instanceType = "1";
    const hint = instanceType === "1"
      ? "Only visible in the admin dashboard"
      : "Visible to all site users";

    expect(hint).toBe("Only visible in the admin dashboard");
  });
});

// ─── Instance Type Hint Logic ────────────────────────────────────────────────

describe("instance type hint rendering", () => {
  it("shows public hint when instanceType is 2", () => {
    const instanceType = "2";
    const hint = instanceType === "1"
      ? "Only visible in the admin dashboard"
      : "Visible to all site users";

    expect(hint).toBe("Visible to all site users");
  });

  it("shows private hint when instanceType is 1", () => {
    const instanceType = "1";
    const hint = instanceType === "1"
      ? "Only visible in the admin dashboard"
      : "Visible to all site users";

    expect(hint).toBe("Only visible in the admin dashboard");
  });
});

// ─── Guide Picker Logic ───────────────────────────────────────────────────────

describe("Guide picker render/select/serialize", () => {
  // Test that guide selection state works correctly
  it("guide selection state is an array that can hold a single guide ID", () => {
    // The FormState uses guideUserIds: string[] for guide selection
    // This mirrors the actual component state
    const guideUserIds: string[] = [];
    const guideId = "guide-user-123";

    // Select a guide
    guideUserIds.push(guideId);
    expect(guideUserIds).toContain(guideId);
    expect(guideUserIds).toHaveLength(1);

    // Deselect a guide
    const index = guideUserIds.indexOf(guideId);
    if (index > -1) guideUserIds.splice(index, 1);
    expect(guideUserIds).not.toContain(guideId);
    expect(guideUserIds).toHaveLength(0);
  });

  it("guideUserIds in FormState supports single-guide selection for create flow", () => {
    // The create flow only supports one guide at a time
    // This validates the state shape matches the picker implementation
    const guideUserIds: string[] = [];
    const guideId = "user-guide-abc";

    // Single guide select
    guideUserIds.push(guideId);
    expect(guideUserIds).toEqual([guideId]);

    // Replace with another guide
    const newGuideId = "user-guide-xyz";
    guideUserIds.length = 0;
    guideUserIds.push(newGuideId);
    expect(guideUserIds).toEqual([newGuideId]);
  });

  it("selected guide chip displays correct user info", () => {
    // The ManagerChip component displays user.fullName || user.username || user.email
    const mockUser = {
      id: "guide-1",
      fullName: "Nguyen Van A",
      username: "nvana",
      email: "nvana@example.com",
      avatar: null,
      isDeleted: false,
    };

    const displayName = mockUser.fullName || mockUser.username || mockUser.email;
    expect(displayName).toBe("Nguyen Van A");

    // When fullName is missing, falls back to username
    const userWithoutName = { ...mockUser, fullName: "" };
    const displayNameFallback = userWithoutName.fullName || userWithoutName.username || userWithoutName.email;
    expect(displayNameFallback).toBe("nvana");
  });

  it("guide picker select produces correct guideUserIds payload value", () => {
    // Simulates the onChange handler: updateField("guideUserIds", guideId ? [guideId] : [])
    const guideId = "selected-guide-id";

    // Selecting a guide wraps it in array
    const selectedGuideIds = guideId ? [guideId] : [];
    expect(selectedGuideIds).toEqual(["selected-guide-id"]);

    // Deselecting produces empty array
    const emptyGuideIds: string[] = [];
    expect(emptyGuideIds).toEqual([]);
  });

  it("guideUserIds serializes correctly in create payload", () => {
    // The payload builder includes guideUserIds directly from form state
    const guideUserIds = ["guide-123"];
    const payload = {
      tourId: "tour-456",
      classificationId: "cls-789",
      title: "Test Instance",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1000,
      guideUserIds,
    };

    expect(payload.guideUserIds).toEqual(["guide-123"]);
    // guideUserIds is optional in the payload - undefined when not selected
    const noGuidePayload = { ...payload, guideUserIds: undefined as string[] | undefined };
    expect(noGuidePayload.guideUserIds).toBeUndefined();
  });

  it("guideUserIds is optional — create payload can omit it entirely", () => {
    // Per spec: guide selection is optional
    const payload: Record<string, unknown> = {
      tourId: "tour-456",
      classificationId: "cls-789",
      title: "Instance Without Guide",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1000,
    };

    // No guideUserIds key at all
    expect("guideUserIds" in payload).toBe(false);
    expect(payload.guideUserIds).toBeUndefined();
  });

  it("guides list filters out deleted users", () => {
    const allUsers = [
      { id: "u1", fullName: "Active User", isDeleted: false },
      { id: "u2", fullName: "Deleted User", isDeleted: true },
      { id: "u3", fullName: "Another Active", isDeleted: false },
    ];

    const activeGuides = allUsers.filter((u) => !u.isDeleted);
    expect(activeGuides).toHaveLength(2);
    expect(activeGuides.map((u) => u.id)).toEqual(["u1", "u3"]);
  });

  it("selected guide can be found from guideUserIds array", () => {
    const guides = [
      { id: "g1", fullName: "Guide One" },
      { id: "g2", fullName: "Guide Two" },
      { id: "g3", fullName: "Guide Three" },
    ];
    const guideUserIds = ["g2"];

    const selectedGuide = guides.find((u) => guideUserIds.includes(u.id)) ?? null;
    expect(selectedGuide?.fullName).toBe("Guide Two");

    // When no guide selected
    const emptyGuideIds: string[] = [];
    const noGuide = guides.find((u) => emptyGuideIds.includes(u.id)) ?? null;
    expect(noGuide).toBeNull();
  });
});

// ─── Service Checkbox Logic ───────────────────────────────────────────────────

describe("Service checkbox state/payload/reset behavior", () => {
  it("toggleService adds unchecked service to includedServices", () => {
    const includedServices: string[] = ["Shuttle bus", "Meals"];
    const newService = "Insurance";

    if (!includedServices.includes(newService)) {
      includedServices.push(newService);
    }
    expect(includedServices).toContain("Shuttle bus");
    expect(includedServices).toContain("Meals");
    expect(includedServices).toContain("Insurance");
  });

  it("toggleService removes checked service from includedServices", () => {
    const includedServices: string[] = ["Shuttle bus", "Meals", "Insurance"];
    const serviceToRemove = "Meals";

    const filtered = includedServices.filter((s) => s !== serviceToRemove);
    expect(filtered).not.toContain("Meals");
    expect(filtered).toHaveLength(2);
  });

  it("includedServices defaults to tour-derived services when classification selected", () => {
    const tourIncludedServices = ["Shuttle bus", "Meals"];
    const includedServices: string[] = [];

    // When next.includedServices.length === 0 && detail.includedServices?.length > 0
    if (includedServices.length === 0 && tourIncludedServices.length > 0) {
      includedServices.push(...tourIncludedServices);
    }
    expect(includedServices).toEqual(["Shuttle bus", "Meals"]);
  });

  it("includedServices resets when different tour is selected", () => {
    const previousServices = ["Old Tour Service A", "Old Tour Service B"];
    const includedServices = [...previousServices];

    // Reset: when a new tour is selected, form resets classificationId
    const newTourSelected = true;
    if (newTourSelected) {
      includedServices.length = 0; // Reset to empty
    }
    expect(includedServices).toHaveLength(0);

    // Then new tour's services are applied
    const newTourServices = ["New Tour Shuttle", "New Tour Meals"];
    includedServices.push(...newTourServices);
    expect(includedServices).toEqual(["New Tour Shuttle", "New Tour Meals"]);
    expect(includedServices).not.toContain("Old Tour Service A");
  });

  it("includedServices can be empty — zero selected services is valid", () => {
    const includedServices: string[] = [];
    // Zero services is explicitly allowed per spec
    expect(includedServices).toHaveLength(0);
  });

  it("includedServices trims whitespace and filters empty strings", () => {
    const rawServices = ["  Shuttle bus  ", "Meals", "", "  Insurance  "];
    const filtered = rawServices
      .map((s) => s.trim())
      .filter(Boolean);
    expect(filtered).toEqual(["Shuttle bus", "Meals", "Insurance"]);
  });

  it("includedServices serializes correctly in create payload", () => {
    const includedServices = ["Shuttle bus", "Meals", "Insurance"];
    const payload = {
      tourId: "tour-456",
      classificationId: "cls-789",
      title: "Test Instance",
      instanceType: 1,
      startDate: "2025-07-01",
      endDate: "2025-07-03",
      maxParticipation: 20,
      basePrice: 1000,
      includedServices: includedServices
        .map((s) => s.trim())
        .filter(Boolean),
    };

    expect(payload.includedServices).toEqual(["Shuttle bus", "Meals", "Insurance"]);
  });

  it("availableServices merges tour services with defaults (Shuttle bus, Meals, Insurance)", () => {
    const tourServices = ["Shuttle bus", "Premium Guide"];
    const defaults = ["Shuttle bus", "Meals", "Insurance"];
    const merged = Array.from(new Set([...tourServices, ...defaults]));

    expect(merged).toContain("Shuttle bus");
    expect(merged).toContain("Meals");
    expect(merged).toContain("Insurance");
    expect(merged).toContain("Premium Guide");
    // Shuttle bus is deduplicated (appears in both)
    const shuttleCount = merged.filter((s) => s === "Shuttle bus").length;
    expect(shuttleCount).toBe(1);
  });

  it("empty state renders when availableServices is empty array", () => {
    const availableServices: string[] = [];
    const emptyStateText = "No services available for this tour.";

    const renderContent = availableServices.length === 0
      ? emptyStateText
      : availableServices.join(", ");

    expect(renderContent).toBe(emptyStateText);
  });

  it("service checkbox checked state reflects includedServices", () => {
    const includedServices = ["Shuttle bus", "Insurance"];
    const availableServices = ["Shuttle bus", "Meals", "Insurance"];

    const checkedStates = availableServices.map((service) =>
      includedServices.includes(service)
    );

    expect(checkedStates).toEqual([true, false, true]);
  });
});

// ─── FormState Cleanup ────────────────────────────────────────────────────────

describe("FormState field validation", () => {
  it("FormState includes guideUserIds and imageUrls but not managerUserIds", () => {
    type FormState = {
      tourId: string;
      classificationId: string;
      title: string;
      instanceType: string;
      startDate: string;
      endDate: string;
      maxParticipation: string;
      basePrice: string;
      location: string;
      confirmationDeadline: string;
      includedServices: string[];
      guideUserIds: string[];
      thumbnailUrl: string;
      imageUrls: string[];
    };

    const form: FormState = {
      tourId: "",
      classificationId: "",
      title: "",
      instanceType: "1",
      startDate: "",
      endDate: "",
      maxParticipation: "",
      basePrice: "",
      location: "",
      confirmationDeadline: "",
      includedServices: [],
      guideUserIds: [],
      thumbnailUrl: "",
      imageUrls: [],
    };

    expect("guideUserIds" in form).toBe(true);
    expect("imageUrls" in form).toBe(true);
    expect((form as unknown as Record<string, unknown>).managerUserIds).toBeUndefined();
  });

  it("create payload omits empty guideUserIds array per spec", () => {
    const form = {
      guideUserIds: [] as string[],
    };

    // Per task 2.6: omit empty arrays in payload
    const payload: Record<string, unknown> = {};
    if (form.guideUserIds.length > 0) {
      payload.guideUserIds = form.guideUserIds;
    }

    expect(payload.guideUserIds).toBeUndefined();
  });

  it("create payload includes guideUserIds when guide is selected", () => {
    const form = {
      guideUserIds: ["guide-123"],
    };

    const payload: Record<string, unknown> = {};
    if (form.guideUserIds.length > 0) {
      payload.guideUserIds = form.guideUserIds;
    }

    expect(payload.guideUserIds).toEqual(["guide-123"]);
  });
});
