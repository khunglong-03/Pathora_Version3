import { describe, expect, it } from "vitest";

import { API_ENDPOINTS } from "../endpoints";

describe("api endpoint contracts", () => {
  it("matches auth and admin backend routes", () => {
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe("/api/auth/login");
    expect(API_ENDPOINTS.AUTH.REGISTER).toBe("/api/auth/register");
    expect(API_ENDPOINTS.AUTH.REFRESH).toBe("/api/auth/refresh");
    expect(API_ENDPOINTS.AUTH.LOGOUT).toBe("/api/auth/logout");
    expect(API_ENDPOINTS.AUTH.GET_ME).toBe("/api/auth/me");
    expect(API_ENDPOINTS.AUTH.GET_TABS).toBe("/api/auth/tabs");
    expect(API_ENDPOINTS.ADMIN.GET_OVERVIEW).toBe("/api/admin/overview");
    expect(API_ENDPOINTS.ADMIN.GET_DASHBOARD).toBe("/api/admin/dashboard");
  });

  it("matches tour admin backend routes", () => {
    expect(API_ENDPOINTS.TOUR.GET_ALL).toBe("/api/tour");
    expect(API_ENDPOINTS.TOUR.CREATE).toBe("/api/tour");
    expect(API_ENDPOINTS.TOUR.UPDATE).toBe("/api/tour");
    expect(API_ENDPOINTS.TOUR.GET_DETAIL("tour-id")).toBe("/api/tour/tour-id");
    expect(API_ENDPOINTS.TOUR.DELETE("tour-id")).toBe("/api/tour/tour-id");
    expect(
      API_ENDPOINTS.TOUR.GET_CLASSIFICATION_PRICING_TIERS("classification-id"),
    ).toBe("/api/tour/classifications/classification-id/pricing-tiers");
    expect(
      API_ENDPOINTS.TOUR.UPSERT_CLASSIFICATION_PRICING_TIERS("classification-id"),
    ).toBe("/api/tour/classifications/classification-id/pricing-tiers");
  });

  it("matches tour-instance backend routes", () => {
    expect(API_ENDPOINTS.TOUR_INSTANCE.GET_ALL).toBe("/api/tour-instance");
    expect(API_ENDPOINTS.TOUR_INSTANCE.CREATE).toBe("/api/tour-instance");
    expect(API_ENDPOINTS.TOUR_INSTANCE.UPDATE).toBe("/api/tour-instance");
    expect(API_ENDPOINTS.TOUR_INSTANCE.GET_STATS).toBe("/api/tour-instance/stats");
    expect(API_ENDPOINTS.TOUR_INSTANCE.GET_DETAIL("instance-id")).toBe(
      "/api/tour-instance/instance-id",
    );
    expect(API_ENDPOINTS.TOUR_INSTANCE.GET_PRICING_TIERS("instance-id")).toBe(
      "/api/tour-instance/instance-id/pricing-tiers",
    );
    expect(API_ENDPOINTS.TOUR_INSTANCE.UPSERT_PRICING_TIERS("instance-id")).toBe(
      "/api/tour-instance/instance-id/pricing-tiers",
    );
    expect(API_ENDPOINTS.TOUR_INSTANCE.CLEAR_PRICING_TIERS("instance-id")).toBe(
      "/api/tour-instance/instance-id/pricing-tiers/clear",
    );
    expect(API_ENDPOINTS.TOUR_INSTANCE.CHANGE_STATUS("instance-id")).toBe(
      "/api/tour-instance/instance-id/status",
    );
    expect(API_ENDPOINTS.TOUR_INSTANCE.RESOLVE_PRICING("instance-id", 4)).toBe(
      "/api/tour-instance/instance-id/pricing/resolve?participants=4",
    );
  });

  it("matches public tour and tour-request backend routes", () => {
    expect(API_ENDPOINTS.PUBLIC_HOME.GET_FEATURED_TOURS(8)).toBe(
      "/api/public/tours/featured?limit=8",
    );
    expect(API_ENDPOINTS.PUBLIC_HOME.GET_LATEST_TOURS(6)).toBe(
      "/api/public/tours/latest?limit=6",
    );
    expect(API_ENDPOINTS.PUBLIC_HOME.GET_DESTINATIONS).toBe("/api/public/destinations");
    expect(API_ENDPOINTS.PUBLIC_HOME.GET_TOUR_DETAIL("tour-id")).toBe(
      "/api/public/tours/tour-id",
    );
    expect(API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.GET_AVAILABLE).toBe(
      "/api/public/tour-instances/available",
    );
    expect(API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.GET_DETAIL("instance-id")).toBe(
      "/api/public/tour-instances/instance-id",
    );
    expect(API_ENDPOINTS.PUBLIC_TOUR_INSTANCE.RESOLVE_PRICING("instance-id", 2)).toBe(
      "/api/public/tour-instances/instance-id/pricing/resolve?participants=2",
    );
    expect(API_ENDPOINTS.TOUR_REQUESTS.CREATE).toBe("/api/public/tour-requests");
    expect(API_ENDPOINTS.TOUR_REQUESTS.MY).toBe("/api/public/tour-requests/my");
    expect(API_ENDPOINTS.TOUR_REQUESTS.DETAIL("request-id")).toBe(
      "/api/public/tour-requests/request-id",
    );
    expect(API_ENDPOINTS.TOUR_REQUESTS.ADMIN_LIST).toBe("/api/tour-requests");
    expect(API_ENDPOINTS.TOUR_REQUESTS.ADMIN_DETAIL("request-id")).toBe(
      "/api/tour-requests/request-id",
    );
    expect(API_ENDPOINTS.TOUR_REQUESTS.REVIEW("request-id")).toBe(
      "/api/tour-requests/request-id/review",
    );
  });

  it("matches payment backend route", () => {
    expect(API_ENDPOINTS.PAYMENT.GET_QR).toBe("/api/payment/getQR");
  });
});
