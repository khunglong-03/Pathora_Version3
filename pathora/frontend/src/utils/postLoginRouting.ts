import type { UserRoleVm } from "@/store/domain/auth";

export type AuthPortal = "admin" | "user";

export const ADMIN_DEFAULT_PATH = "/dashboard";
export const USER_DEFAULT_PATH = "/home";

export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/tour-management",
  "/tour-instances",
  "/admin",
];

const ADMIN_ROLE_NAMES = new Set(["Admin"]);
const MANAGER_ROLE_NAMES = new Set(["Manager"]);
const ADMIN_ROLE_DEFAULT_PATH = "/admin/users";
const MANAGER_ROLE_DEFAULT_PATH = "/dashboard";

type RoleWithName = Pick<UserRoleVm, "name">;

const resolveRoleDefaultPath = (
  roles?: RoleWithName[] | null,
  portal?: string | null | undefined,
): string => {
  const isAdmin =
    portal?.trim().toLowerCase() === "admin" ||
    roles?.some((r) => ADMIN_ROLE_NAMES.has(r.name));

  if (isAdmin) {
    if (roles && roles.length > 0) {
      if (roles.some((role) => ADMIN_ROLE_NAMES.has(role.name))) {
        return ADMIN_ROLE_DEFAULT_PATH;
      }
      if (roles.some((role) => MANAGER_ROLE_NAMES.has(role.name))) {
        return MANAGER_ROLE_DEFAULT_PATH;
      }
    }
    return ADMIN_ROLE_DEFAULT_PATH;
  }

  if (!roles || roles.length === 0) {
    return USER_DEFAULT_PATH;
  }
  if (roles.some((role) => ADMIN_ROLE_NAMES.has(role.name))) {
    return ADMIN_ROLE_DEFAULT_PATH;
  }
  if (roles.some((role) => MANAGER_ROLE_NAMES.has(role.name))) {
    return MANAGER_ROLE_DEFAULT_PATH;
  }
  return USER_DEFAULT_PATH;
};

export const USER_PRIVATE_ROUTE_PREFIXES = [
  "/custom-tour-request",
  "/my-custom-tour-requests",
];

const startsWithRoutePrefix = (pathname: string, prefix: string): boolean => {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

export const isAdminRoutePath = (pathname: string): boolean => {
  return ADMIN_ROUTE_PREFIXES.some((prefix) => startsWithRoutePrefix(pathname, prefix));
};

export const isUserPrivateRoutePath = (pathname: string): boolean => {
  return USER_PRIVATE_ROUTE_PREFIXES.some((prefix) =>
    startsWithRoutePrefix(pathname, prefix),
  );
};

export const normalizePortal = (portal: string | null | undefined): AuthPortal | null => {
  const value = portal?.trim().toLowerCase();
  if (value === "admin") {
    return "admin";
  }
  if (value === "user") {
    return "user";
  }
  return null;
};

export const sanitizePath = (path: string | null | undefined): string | null => {
  const value = path?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
};

export const inferPortalFromDefaultPath = (
  defaultPath: string | null | undefined,
): AuthPortal | null => {
  const path = sanitizePath(defaultPath);
  if (!path) {
    return null;
  }

  if (isAdminRoutePath(path)) {
    return "admin";
  }

  if (isUserPrivateRoutePath(path) || startsWithRoutePrefix(path, "/home")) {
    return "user";
  }

  return null;
};

export const resolveAuthPortal = (
  portal: string | null | undefined,
  defaultPath?: string | null,
): AuthPortal | null => {
  const normalized = normalizePortal(portal);
  if (normalized) {
    return normalized;
  }

  return inferPortalFromDefaultPath(defaultPath);
};

export const resolvePostLoginPath = (
  defaultPath: string | null | undefined,
  portal: string | null | undefined,
  roles?: RoleWithName[] | null,
): string => {
  const safePath = sanitizePath(defaultPath);
  if (safePath) {
    return safePath;
  }

  const normalizedPortal = resolveAuthPortal(portal, defaultPath);
  if (normalizedPortal === "admin") {
    return resolveRoleDefaultPath(roles, portal);
  }
  return USER_DEFAULT_PATH;
};
