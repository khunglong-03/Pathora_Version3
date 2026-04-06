import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("route lazy loading", () => {
  it("configures dynamic route imports with explicit loading fallbacks", () => {
    const routes = [
      {
        pagePath: "src/app/(user)/about/page.tsx",
        loadingImport: "import AboutLoading from \"./loading\";",
        loadingReference: "AboutLoading",
      },
      {
        pagePath: "src/app/(user)/policies/page.tsx",
        loadingImport: "import PoliciesLoading from \"./loading\";",
        loadingReference: "PoliciesLoading",
      },
      {
        pagePath: "src/app/(user)/tours/page.tsx",
        loadingImport: "import ToursLoading from \"./loading\";",
        loadingReference: "ToursLoading",
      },
    ];

    routes.forEach(({ pagePath, loadingImport, loadingReference }) => {
      const source = readFile(pagePath);

      expect(source.includes("dynamic(")).toBe(true);
      expect(source.includes(loadingImport)).toBe(true);
      expect(source.includes(`loading: () => <${loadingReference} />`)).toBe(
        true,
      );
    });
  });
});
