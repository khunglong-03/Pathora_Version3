import type { UserRoleVm } from "@/store/domain/auth";

export const USER_DEFAULT_PATH = "/home";

const ADMIN_PORTAL = "admin";

export const ADMIN_ROLE_NAMES = new Set(["Admin"]);
export const MANAGER_ROLE_NAMES = new Set(["Manager"]);

export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/tour-requests",
  "/tour-management",
  "/tour-instances",
  "/pricing-policies",
  "/tax-configs",
] as const;

export const MANAGER_ROUTE_PREFIXES = [
  "/dashboard",
  "/tour-management",
  "/tour-instances",
] as const;

type RoleWithName = Pick<UserRoleVm, "name">;

export interface AuthRoutingInput {
  defaultPath?: string | null;
  portal?: string | null;
  roles?: RoleWithName[] | null;
  fallbackPath?: string;
}

const isValidPath = (path?: string | null): path is string =>
  typeof path === "string" && path.startsWith("/") && path.length > 1;

export const isAdminPortal = (portal?: string | null): boolean =>
  portal?.toLowerCase() === ADMIN_PORTAL;

export const hasAdminRole = (roles?: RoleWithName[] | null): boolean =>
  !!roles?.some((role) => ADMIN_ROLE_NAMES.has(role.name));

export const hasManagerRole = (roles?: RoleWithName[] | null): boolean =>
  !!roles?.some((role) => MANAGER_ROLE_NAMES.has(role.name));

export const isManagerRoutePath = (pathname: string): boolean =>
  MANAGER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const parseAuthRoles = (cookieValue: string | undefined): string[] => {
  if (!cookieValue) return [];
  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as string[];
  } catch {
    return [];
  }
};

export const ADMIN_ROLE_DEFAULT_PATH = "/admin/users";
export const MANAGER_ROLE_DEFAULT_PATH = "/manager";
export const HOTELSERVICEPROVIDER_ROLE_DEFAULT_PATH = "/hotel";
export const TRANSPORTPROVIDER_ROLE_DEFAULT_PATH = "/transport";

export const PROVIDER_ROLE_NAMES = new Set(["HotelServiceProvider", "TransportProvider"]);

export const resolveRoleDefaultPath = (
  roles?: RoleWithName[] | null,
  portal?: string | null,
): string => {
  if (isAdminPortal(portal)) {
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
  if (roles.some((role) => role.name === "HotelServiceProvider")) {
    return HOTELSERVICEPROVIDER_ROLE_DEFAULT_PATH;
  }
  if (roles.some((role) => role.name === "TransportProvider")) {
    return TRANSPORTPROVIDER_ROLE_DEFAULT_PATH;
  }
  return USER_DEFAULT_PATH;
};

export const resolvePostLoginPath = ({
  defaultPath,
  portal,
  roles,
  fallbackPath = USER_DEFAULT_PATH,
}: AuthRoutingInput): string => {
  if (isValidPath(defaultPath)) {
    return defaultPath;
  }

  // Always resolve roles when present — role takes precedence over portal
  if (roles && roles.length > 0) {
    return resolveRoleDefaultPath(roles, portal);
  }

  if (isAdminPortal(portal)) {
    return resolveRoleDefaultPath(roles, portal);
  }

  return isValidPath(fallbackPath) ? fallbackPath : USER_DEFAULT_PATH;
};

export const isAdminRoutePath = (pathname: string): boolean =>
  ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const isProviderRoutePath = (pathname: string): boolean =>
  ["/hotel", "/transport"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const isLoginEntryPath = (
  pathname: string,
  searchParams: URLSearchParams,
): boolean => {
  if (pathname === "/") {
    return true;
  }

  return pathname === "/home" && searchParams.get("login") === "true";
};

/**
 * Validates that a `next` path is a safe internal relative path.
 * Prevents open-redirect vulnerabilities by rejecting external URLs,
 * absolute paths, or paths with protocols.
 */
export const isSafeNextPath = (next?: string | null): next is string => {
  if (!next || typeof next !== "string") {
    return false;
  }

  // Must start with /
  if (!next.startsWith("/")) {
    return false;
  }

  // Must be a relative path (no protocol, no host)
  try {
    const url = new URL(next, "http://localhost");
    // If it has a different origin, it's not safe
    if (url.origin !== "http://localhost") {
      return false;
    }
  } catch {
    return false;
  }

  // Should not contain null bytes or other dangerous characters
  if (next.includes("\0") || next.includes("\n")) {
    return false;
  }

  return true;
};

/**
 * Resolves the post-login destination, prioritizing a valid `next` parameter
 * for non-admin users when present.
 */
export const resolveLoginDestination = ({
  next,
  defaultPath,
  portal,
  roles,
  fallbackPath = USER_DEFAULT_PATH,
}: {
  next?: string | null;
  defaultPath?: string | null;
  portal?: string | null;
  roles?: RoleWithName[] | null;
  fallbackPath?: string;
}): string => {
  // First priority: valid next parameter for non-admin users
  if (isSafeNextPath(next) && !isAdminPortal(portal) && !hasAdminRole(roles)) {
    return next;
  }

  // Fall back to existing resolvePostLoginPath logic
  return resolvePostLoginPath({ defaultPath, portal, roles, fallbackPath });
};
