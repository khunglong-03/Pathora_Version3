import { describe, expectTypeOf, it } from "vitest";

import "../api";
import type { ApiError, ApiResponse, PaginatedResponse } from "../api";

interface SampleEntity {
  id: string;
  name: string;
}

describe("api types", () => {
  it("defines ApiResponse generic with success/data/error fields", () => {
    const successResponse: ApiResponse<SampleEntity> = {
      success: true,
      data: { id: "1", name: "sample" },
    };
    const errorResponse: ApiResponse<SampleEntity> = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "BAD_REQUEST",
      },
    };

    expectTypeOf(successResponse.data).toEqualTypeOf<
      SampleEntity | null | undefined
    >();
    expectTypeOf(errorResponse.error).toEqualTypeOf<ApiError | undefined>();
  });

  it("defines PaginatedResponse metadata shape", () => {
    const paginated: PaginatedResponse<SampleEntity> = {
      items: [{ id: "1", name: "sample" }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    expectTypeOf(paginated.items).toEqualTypeOf<SampleEntity[]>();
    expectTypeOf(paginated.total).toEqualTypeOf<number>();
  });
});
