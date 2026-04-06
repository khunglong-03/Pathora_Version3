import { describe, expect, it } from "vitest";

import { resolveTourThumbnailUrl } from "../tourMedia";

describe("resolveTourThumbnailUrl", () => {
  it("returns null when url is missing or invalid", () => {
    expect(
      resolveTourThumbnailUrl({
        fileId: null,
        fileName: null,
        originalFileName: null,
        publicURL: "",
      }),
    ).toBeNull();

    expect(
      resolveTourThumbnailUrl({
        fileId: null,
        fileName: null,
        originalFileName: null,
        publicURL: "ftp://cdn.pathora.test/thumb.jpg",
      }),
    ).toBeNull();
  });

  it("returns trimmed http(s) urls", () => {
    expect(
      resolveTourThumbnailUrl({
        fileId: "thumb-1",
        fileName: "thumb.jpg",
        originalFileName: "thumb.jpg",
        publicURL: " https://cdn.pathora.test/thumb.jpg ",
      }),
    ).toBe("https://cdn.pathora.test/thumb.jpg");
  });
});
