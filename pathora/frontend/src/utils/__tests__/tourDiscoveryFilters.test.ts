import { describe, expect, it } from "vitest";

import {
  areTourDiscoveryFiltersEqual,
  buildTourDiscoverySearchParams,
  parseTourDiscoveryFilters,
} from "../tourDiscoveryFilters";

describe("tourDiscoveryFilters", () => {
  it("hydrates filters from query params", () => {
    const params = new URLSearchParams(
      "destination=Da%20Nang&classification=VIP&date=2026-05-01&people=4&minPrice=2000000&maxPrice=5000000&minDays=4&maxDays=7&page=3&view=instances",
    );

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed).toEqual({
      destination: "Da Nang",
      classifications: ["VIP"],
      categories: [],
      date: "2026-05-01",
      people: 4,
      minPrice: 2000000,
      maxPrice: 5000000,
      minDays: 4,
      maxDays: 7,
      page: 3,
      view: "instances",
      instanceType: null,
    });
  });

  it("uses scheduled tab as instances fallback", () => {
    const params = new URLSearchParams("tab=scheduled");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.view).toBe("instances");
    expect(parsed.instanceType).toBeNull();
  });

  it("serializes applied filters for URL sync", () => {
    const params = buildTourDiscoverySearchParams({
      destination: "Ha Noi",
      classifications: ["Premium Tour"],
      categories: [],
      date: "",
      people: 2,
      minPrice: 1000000,
      maxPrice: 3000000,
      minDays: 1,
      maxDays: 3,
      page: 2,
      view: "tours",
      instanceType: null,
    });

    expect(params.toString()).toBe(
      "destination=Ha+Noi&classification=Premium+Tour&people=2&minPrice=1000000&maxPrice=3000000&minDays=1&maxDays=3&page=2",
    );
  });

  it("detects equality for pagination-preserving sync", () => {
    const a = parseTourDiscoveryFilters(
      new URLSearchParams("destination=Hue&page=2"),
    );
    const b = parseTourDiscoveryFilters(
      new URLSearchParams("destination=Hue&page=2"),
    );

    expect(areTourDiscoveryFiltersEqual(a, b)).toBe(true);
  });

  // Group 6.1: classification comma-separated value parses into array
  it("parses classification=premium,vip-luxury into an array", () => {
    const params = new URLSearchParams("classification=premium,vip-luxury");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual(["premium", "vip-luxury"]);
  });

  it("parses multiple categories separated by comma into array", () => {
    const params = new URLSearchParams("category=Adventure%20Tour,Cultural%20Tour");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.categories).toEqual(["Adventure Tour", "Cultural Tour"]);
  });

  it("parses both classification and category together", () => {
    const params = new URLSearchParams("classification=premium,vip-luxury&category=Adventure%20Tour");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual(["premium", "vip-luxury"]);
    expect(parsed.categories).toEqual(["Adventure Tour"]);
  });

  // Group 6.2: missing classification and category returns empty arrays
  it("returns empty classifications array when classification param is absent", () => {
    const params = new URLSearchParams("destination=Da%20Nang&people=2");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual([]);
  });

  it("returns empty categories array when category param is absent", () => {
    const params = new URLSearchParams("destination=Ha%20Long%20Bay&page=1");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.categories).toEqual([]);
  });

  it("returns empty arrays when neither classification nor category is provided", () => {
    const params = new URLSearchParams("destination=Ha%20Noi&date=2026-05-01");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual([]);
    expect(parsed.categories).toEqual([]);
  });

  it("returns empty arrays when query string is completely empty", () => {
    const params = new URLSearchParams();

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual([]);
    expect(parsed.categories).toEqual([]);
    expect(parsed.destination).toBe("");
    expect(parsed.people).toBeNull();
  });

  // Group 6.3: special characters are URL-encoded properly
  it("parses classification param with special characters from URL", () => {
    const params = new URLSearchParams("classification=VIP%2FLuxury%20Tour");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual(["VIP/Luxury Tour"]);
  });

  it("serializes classification with special characters as URL-safe string", () => {
    const params = buildTourDiscoverySearchParams({
      destination: "",
      classifications: ["VIP / Luxury Tour"],
      categories: [],
      date: "",
      people: null,
      minPrice: null,
      maxPrice: null,
      minDays: null,
      maxDays: null,
      page: 1,
      view: "tours",
      instanceType: null,
    });

    // URLSearchParams.toString() automatically encodes special chars
    expect(params.toString()).toBe("classification=VIP+%2F+Luxury+Tour");
  });

  it("parses category param with special characters from URL", () => {
    const params = new URLSearchParams("category=Honeymoon%20Tour,Religious%20Tour");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.categories).toEqual(["Honeymoon Tour", "Religious Tour"]);
  });

  it("serializes category param to URL", () => {
    const params = buildTourDiscoverySearchParams({
      destination: "Da Nang",
      classifications: ["premium"],
      categories: ["Adventure Tour"],
      date: "",
      people: null,
      minPrice: null,
      maxPrice: null,
      minDays: null,
      maxDays: null,
      page: 1,
      view: "tours",
      instanceType: null,
    });

    expect(params.toString()).toBe(
      "destination=Da+Nang&classification=premium&category=Adventure+Tour",
    );
  });

  // Additional: equality checks with classifications and categories
  it("detects inequality when classifications differ", () => {
    const a = parseTourDiscoveryFilters(
      new URLSearchParams("classification=premium"),
    );
    const b = parseTourDiscoveryFilters(
      new URLSearchParams("classification=vip-luxury"),
    );

    expect(areTourDiscoveryFiltersEqual(a, b)).toBe(false);
  });

  it("detects inequality when categories differ", () => {
    const a = parseTourDiscoveryFilters(
      new URLSearchParams("category=Adventure%20Tour"),
    );
    const b = parseTourDiscoveryFilters(
      new URLSearchParams("category=Cultural%20Tour"),
    );

    expect(areTourDiscoveryFiltersEqual(a, b)).toBe(false);
  });

  it("treats same values in different order as equal (order-independent)", () => {
    const a = parseTourDiscoveryFilters(
      new URLSearchParams("classification=vip-luxury,premium"),
    );
    const b = parseTourDiscoveryFilters(
      new URLSearchParams("classification=premium,vip-luxury"),
    );

    expect(areTourDiscoveryFiltersEqual(a, b)).toBe(true);
  });

  it("treats same category values in different order as equal", () => {
    const a = parseTourDiscoveryFilters(
      new URLSearchParams("category=Cultural%20Tour,Adventure%20Tour"),
    );
    const b = parseTourDiscoveryFilters(
      new URLSearchParams("category=Adventure%20Tour,Cultural%20Tour"),
    );

    expect(areTourDiscoveryFiltersEqual(a, b)).toBe(true);
  });

  it("serializes empty classifications and categories arrays as no params", () => {
    const params = buildTourDiscoverySearchParams({
      destination: "Da Nang",
      classifications: [],
      categories: [],
      date: "",
      people: 2,
      minPrice: null,
      maxPrice: null,
      minDays: null,
      maxDays: null,
      page: 1,
      view: "tours",
      instanceType: null,
    });

    expect(params.toString()).toBe("destination=Da+Nang&people=2");
  });

  it("trims whitespace from parsed classification values", () => {
    const params = new URLSearchParams("classification=premium%20,%20vip-luxury");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual(["premium", "vip-luxury"]);
  });

  it("filters out empty strings from classification array", () => {
    const params = new URLSearchParams("classification=premium,,vip-luxury,");

    const parsed = parseTourDiscoveryFilters(params);

    expect(parsed.classifications).toEqual(["premium", "vip-luxury"]);
  });
});
