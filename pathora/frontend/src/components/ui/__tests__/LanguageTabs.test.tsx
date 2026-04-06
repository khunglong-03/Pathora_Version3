import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LanguageTabs from "../LanguageTabs";

describe("LanguageTabs", () => {
  it("renders Vietnamese and English tabs with active state", () => {
    const markup = renderToStaticMarkup(
      <LanguageTabs activeLanguage="vi" onChange={() => {}} />,
    );

    expect(markup).toContain("Tiếng Việt");
    expect(markup).toContain("English");
    expect(markup).toContain("bg-white text-slate-900 shadow-sm");
    expect(markup).toContain("Required");
  });
});
