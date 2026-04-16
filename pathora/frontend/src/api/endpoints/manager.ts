// Manager-specific API endpoints
// Routes under /api/manager/...

export interface ManagerEndpoints {
  GET_DASHBOARD: string;
  GET_OVERVIEW: string;
  GET_TOUR_MANAGER_STAFF: (managerId: string) => string;
}

export const MANAGER: ManagerEndpoints = {
  GET_DASHBOARD: "/api/manager/dashboard",
  GET_OVERVIEW: "/api/manager/overview",
  GET_TOUR_MANAGER_STAFF: (managerId: string): string =>
    `/api/manager/tour-managers/${managerId}/staff`,
};
