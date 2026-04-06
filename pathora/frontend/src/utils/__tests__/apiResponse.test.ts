import { describe, expect, it } from "vitest";

import {
  extractData,
  extractItems,
  extractResult,
  handleApiError,
} from "../apiResponse";

describe("apiResponse helpers", () => {
  it("extracts items from nested result.items", () => {
    const items = extractItems<{ id: number }>({
      result: {
        items: [{ id: 1 }, { id: 2 }],
      },
    });

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("extracts typed data from ApiResponse payload", () => {
    const data = extractData<{ id: string }>({
      success: true,
      data: { id: "abc" },
    });

    expect(data).toEqual({ id: "abc" });
  });

  it("normalizes axios-like API errors into ApiError", () => {
    const normalized = handleApiError({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errors: [
            {
              code: "BAD_REQUEST",
              errorMessage: "BAD_REQUEST",
              details: "invalid payload",
            },
          ],
        },
      },
    });

    expect(normalized).toEqual({
      code: "BAD_REQUEST",
      message: "BAD_REQUEST",
      details: "invalid payload",
    });
  });

  it("keeps extractResult backward-compatible", () => {
    const result = extractResult<string>({ result: "ok" });
    expect(result).toBe("ok");
  });
});
