import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { extractResult } from "@/utils/apiResponse";

// ============ Types ============

export interface RoleVm {
  id: number;
  name: string;
  description: string;
  status: number;
}

export type RoleDetailVm = RoleVm;

export interface LookupVm {
  id: number;
  name: string;
}

export interface PaginatedRolesResponse {
  total: number;
  data: RoleVm[];
  buttonShow?: Record<string, boolean>;
}

export interface CreateRolePayload {
  name: string;
  description: string;
}

export interface UpdateRolePayload {
  roleId: number;
  name: string;
  description: string;
  status: number;
}

// ============ Service ============

export const roleService = {
  /**
   * GET /api/role — Get paginated list of roles
   */
  getAll: async (): Promise<PaginatedRolesResponse | null> => {
    const response = await api.get(API_ENDPOINTS.ROLE.GET_ALL);
    return extractResult<PaginatedRolesResponse>(response.data) ?? null;
  },

  /**
   * GET /api/role/{roleId} — Get role detail
   */
  getDetail: async (roleId: number): Promise<RoleDetailVm | null> => {
    const response = await api.get(API_ENDPOINTS.ROLE.GET_DETAIL(roleId));
    return extractResult<RoleDetailVm>(response.data) ?? null;
  },

  /**
   * GET /api/role/lookup — Get all roles as lookup (id + name)
   */
  getLookup: async (): Promise<LookupVm[]> => {
    const response = await api.get(API_ENDPOINTS.ROLE.GET_LOOKUP);
    return extractResult<LookupVm[]>(response.data) ?? [];
  },

  /**
   * POST /api/role — Create a new role
   */
  create: async (payload: CreateRolePayload): Promise<number | null> => {
    const response = await api.post(API_ENDPOINTS.ROLE.CREATE, payload);
    return extractResult<number>(response.data) ?? null;
  },

  /**
   * PUT /api/role — Update an existing role
   */
  update: async (payload: UpdateRolePayload): Promise<void> => {
    await api.put(API_ENDPOINTS.ROLE.UPDATE, payload);
  },

  /**
   * DELETE /api/role/{roleId} — Soft-delete a role
   */
  delete: async (roleId: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.ROLE.DELETE(roleId));
  },
};
