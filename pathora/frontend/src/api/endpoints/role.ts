// Role Management Endpoints

export type EndpointWithRoleId = (roleId: number) => string;

export interface RoleEndpoints {
  GET_ALL: string;
  GET_DETAIL: EndpointWithRoleId;
  GET_LOOKUP: string;
  CREATE: string;
  UPDATE: string;
  DELETE: EndpointWithRoleId;
}

export const ROLE: RoleEndpoints = {
  GET_ALL: "api/role",
  GET_DETAIL: (roleId: number) => `api/role/${roleId}`,
  GET_LOOKUP: "api/role/lookup",
  CREATE: "api/role",
  UPDATE: "api/role",
  DELETE: (roleId: number) => `api/role/${roleId}`,
};
