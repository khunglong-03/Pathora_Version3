import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import DashboardTourManagementPage from "../manager/dashboard/tour-management/page";
import DashboardCreateTourManagementPage from "../manager/dashboard/tour-management/create/page";
import DashboardTourInstancesPage from "../manager/dashboard/tour-instances/page";
import DashboardVisaPage from "../manager/dashboard/visa/page";
import DashboardCustomersPage from "../manager/dashboard/customers/page";
import DashboardInsurancePage from "../manager/dashboard/insurance/page";
import DashboardPaymentsPage from "../manager/dashboard/payments/page";
import DashboardPoliciesPage from "../manager/dashboard/policies/page";
import DashboardSiteContentPage from "../manager/dashboard/site-content/page";

describe("dashboard nested routes", () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it("redirects legacy dashboard tour route to canonical tour management", () => {
    DashboardTourManagementPage();
    expect(redirectMock).toHaveBeenCalledWith("/tour-management");
  });

  it("redirects legacy dashboard create-tour route", () => {
    DashboardCreateTourManagementPage();
    expect(redirectMock).toHaveBeenCalledWith("/tour-management?create=true");
  });

  it("redirects legacy dashboard tour-instances route", () => {
    DashboardTourInstancesPage();
    expect(redirectMock).toHaveBeenCalledWith("/tour-instances");
  });

  it("renders visa dashboard page component", () => {
    const element = DashboardVisaPage();
    expect(React.isValidElement(element)).toBe(true);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders payments dashboard page component", () => {
    const element = DashboardPaymentsPage();
    expect(React.isValidElement(element)).toBe(true);
  });

  it("redirects legacy dashboard customers route to staff schedule", () => {
    DashboardCustomersPage();
    expect(redirectMock).toHaveBeenCalledWith("/manager/staff-schedule");
  });

  it("renders insurance dashboard page component", () => {
    const element = DashboardInsurancePage();
    expect(React.isValidElement(element)).toBe(true);
  });


  it("redirects legacy dashboard policies route", () => {
    DashboardPoliciesPage();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/settings?tab=policies");
  });

  it("renders site content dashboard page component", () => {
    const element = DashboardSiteContentPage();
    expect(React.isValidElement(element)).toBe(true);
  });
});
