import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import DashboardTourManagementPage from "../(dashboard)/dashboard/tour-management/page";
import DashboardCreateTourManagementPage from "../(dashboard)/dashboard/tour-management/create/page";
import DashboardTourInstancesPage from "../(dashboard)/dashboard/tour-instances/page";
import DashboardVisaPage from "../(dashboard)/dashboard/visa/page";
import DashboardCustomersPage from "../(dashboard)/dashboard/customers/page";
import DashboardInsurancePage from "../(dashboard)/dashboard/insurance/page";
import DashboardPaymentsPage from "../(dashboard)/dashboard/payments/page";
import DashboardSettingsPage from "../(dashboard)/dashboard/settings/page";
import DashboardPoliciesPage from "../(dashboard)/dashboard/policies/page";
import DashboardSiteContentPage from "../(dashboard)/dashboard/site-content/page";

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

  it("renders customers dashboard page component", () => {
    const element = DashboardCustomersPage();
    expect(React.isValidElement(element)).toBe(true);
  });

  it("renders insurance dashboard page component", () => {
    const element = DashboardInsurancePage();
    expect(React.isValidElement(element)).toBe(true);
  });

  it("renders settings dashboard page component", () => {
    const element = DashboardSettingsPage();
    expect(React.isValidElement(element)).toBe(true);
  });

  it("renders policies dashboard page component", () => {
    const element = DashboardPoliciesPage();
    expect(React.isValidElement(element)).toBe(true);
  });

  it("renders site content dashboard page component", () => {
    const element = DashboardSiteContentPage();
    expect(React.isValidElement(element)).toBe(true);
  });
});
