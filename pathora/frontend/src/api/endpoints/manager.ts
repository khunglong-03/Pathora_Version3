// Manager-specific API endpoints
// Routes under /api/manager/...

export interface ManagerEndpoints {
  GET_DASHBOARD: string;
}

export const MANAGER: ManagerEndpoints = {
  GET_DASHBOARD: "/api/manager/dashboard",
};
