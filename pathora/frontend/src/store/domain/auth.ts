export interface UserRoleVm {
  type: number;
  id: string;
  name: string;
}

export interface UserDepartmentVm {
  id: string;
  name: string;
  positionId: string | null;
  positionName: string | null;
}

/** Matches backend UserInfoVm returned from GET /api/auth/me */
export interface UserInfo {
  id: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
  forcePasswordChange: boolean;
  roles: UserRoleVm[];
  departments: UserDepartmentVm[];
  portal: string | null;
  defaultPath: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  preferredLanguage?: string | null;
}

/** @deprecated Use UserInfo instead */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  username: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "admin" | "manager" | "user" | "guest" | string;

export interface AuthState {
  isAuth: boolean;
  user: UserInfo | null;
  token: string | null;
}
