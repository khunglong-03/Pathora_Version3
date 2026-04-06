import { describe, expect, it } from "vitest";

import type { AdminVisaApplication } from "@/types/admin";
import { buildVisaRowKeys } from "../visaPageLogic";

const createVisaApplication = (
  overrides: Partial<AdminVisaApplication> = {},
): AdminVisaApplication => {
  return {
    id: "VISA-001",
    booking: "Japan Sakura Tour",
    applicant: "Nguyen Van A",
    passport: "P1234567",
    country: "Japan",
    type: "Tourist",
    status: "approved",
    submittedDate: "Feb 15, 2026",
    decisionDate: "Mar 1, 2026",
    ...overrides,
  };
};

describe("visaPageLogic", () => {
  it("preserves visa id as row key when ids are unique", () => {
    const visas = [
      createVisaApplication({ id: "VISA-001" }),
      createVisaApplication({ id: "VISA-002" }),
    ];

    expect(buildVisaRowKeys(visas)).toEqual(["VISA-001", "VISA-002"]);
  });

  it("creates unique row keys when visa ids collide", () => {
    const duplicateId = "VISA-019527F5";
    const visas = [
      createVisaApplication({
        id: duplicateId,
        applicant: "Nguyen Van A",
      }),
      createVisaApplication({
        id: duplicateId,
        applicant: "Tran Thi B",
      }),
      createVisaApplication({
        id: duplicateId,
        applicant: "Tran Thi B",
      }),
    ];

    const keys = buildVisaRowKeys(visas);

    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
    expect(keys.every((key) => key.startsWith(duplicateId))).toBe(true);
  });
});
