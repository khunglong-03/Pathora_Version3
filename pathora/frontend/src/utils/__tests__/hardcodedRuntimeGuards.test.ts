import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const PROTECTED_RUNTIME_FILES: ReadonlyArray<{
  filePath: string;
  bannedPatterns: ReadonlyArray<string>;
}> = [
  {
    filePath: "src/api/axiosInstance.ts",
    bannedPatterns: ["http://localhost:8080"],
  },
  {
    filePath: "src/store/api/apiSlice.ts",
    bannedPatterns: ["http://localhost:8080"],
  },
  {
    filePath: "src/features/shared/components/AuthModal.tsx",
    bannedPatterns: ["http://localhost:8080"],
  },
];

describe("hardcoded runtime guards", () => {
  it("does not allow banned hardcoded patterns in protected frontend runtime files", () => {
    const frontendRoot = process.cwd();

    PROTECTED_RUNTIME_FILES.forEach(({ filePath, bannedPatterns }) => {
      const absolutePath = path.join(frontendRoot, filePath);
      const fileContent = fs.readFileSync(absolutePath, "utf8");

      bannedPatterns.forEach((pattern) => {
        expect(fileContent).not.toContain(pattern);
      });
    });
  });
});
