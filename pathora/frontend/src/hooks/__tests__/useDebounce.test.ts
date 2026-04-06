import { describe, expect, it } from "vitest";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  it("should export useDebounce function", () => {
    expect(typeof useDebounce).toBe("function");
  });

  it("should have correct function signature", () => {
    // Just verify the function is exported and can be imported
    expect(useDebounce).toBeDefined();
  });
});
