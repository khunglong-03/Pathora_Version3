import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiResponse } from "@/types/api";
import { executeApiRequest } from "./serviceExecutor";

// Entity type constants matching backend AssignedEntityType enum
export const ASSIGNED_ENTITY_TYPE = {
  TourDesigner: 1,
  TourGuide: 2,
  Tour: 3,
} as const;

// Role-in-team constants matching backend AssignedRoleInTeam enum
export const ASSIGNED_ROLE_IN_TEAM = {
  Lead: 1,
  Member: 2,
} as const;

export interface AssignmentItem {
  assignedUserId?: string;
  assignedTourId?: string;
  assignedEntityType: number;
  assignedRoleInTeam?: number | null;
}

export interface TourManagerSummary {
  managerId: string;
  managerName: string;
  managerEmail: string;
  designerCount: number;
  guideCount: number;
  tourCount: number;
}

export interface AssignmentItemDetail {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  tourId?: string;
  tourName?: string;
  entityType: number;
  roleInTeam?: number | null;
  createdAt: string;
}

export interface TourManagerAssignmentDetail {
  managerId: string;
  managerName: string;
  managerEmail: string;
  assignments: AssignmentItemDetail[];
}

export interface AssignRequest {
  tourManagerUserId: string;
  assignments: AssignmentItem[];
}

export interface BulkAssignRequest {
  managerId: string;
  assignments: AssignmentItem[];
}

export interface RemoveParams {
  assignedUserId?: string;
  assignedTourId?: string;
  assignedEntityType: number;
}

export const tourManagerAssignmentService = {
  getAll: (managerId?: string): Promise<ApiResponse<TourManagerSummary[]>> => {
    const params = managerId ? new URLSearchParams({ managerId }) : undefined;
    const url = params
      ? `${API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.GET_ALL}?${params.toString()}`
      : API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.GET_ALL;
    return executeApiRequest<TourManagerSummary[]>(() => api.get(url));
  },

  getById: (managerId: string): Promise<ApiResponse<TourManagerAssignmentDetail>> => {
    return executeApiRequest<TourManagerAssignmentDetail>(() =>
      api.get(API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.GET_BY_ID(managerId)),
    );
  },

  assign: (data: AssignRequest): Promise<ApiResponse<string>> => {
    return executeApiRequest<string>(() =>
      api.post(API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.ASSIGN, data),
    );
  },

  bulkAssign: (managerId: string, assignments: AssignmentItem[]): Promise<ApiResponse<void>> => {
    const payload: BulkAssignRequest = { managerId, assignments };
    return executeApiRequest<void>(() =>
      api.post(API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.BULK_ASSIGN, payload),
    );
  },

  remove: (managerId: string, params: RemoveParams): Promise<ApiResponse<void>> => {
    const query = new URLSearchParams();
    if (params.assignedUserId) {
      query.set("assignedUserId", params.assignedUserId);
    }
    if (params.assignedTourId) {
      query.set("assignedTourId", params.assignedTourId);
    }
    query.set("assignedEntityType", String(params.assignedEntityType));
    return executeApiRequest<void>(() =>
      api.delete(
        `${API_ENDPOINTS.TOUR_MANAGER_ASSIGNMENT.REMOVE(managerId)}?${query.toString()}`,
      ),
    );
  },
};
