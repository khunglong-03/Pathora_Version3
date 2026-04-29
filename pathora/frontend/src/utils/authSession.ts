import { deleteCookie, getCookie, setCookie } from "./cookie";
import { isJwtExpired } from "./jwt";
import { resolveAuthPortal } from "./authRouting";

const DAY_SECONDS = 60 * 60 * 24;
const WEEK_SECONDS = DAY_SECONDS * 7;

export const persistAuthSession = (
  accessToken: string,
  refreshToken: string,
  portal?: string | null,
  defaultPath?: string | null,
): void => {
  setCookie("access_token", accessToken, DAY_SECONDS);
  setCookie("refresh_token", refreshToken, WEEK_SECONDS);
  setCookie("auth_status", "1", WEEK_SECONDS);

  const resolvedPortal = resolveAuthPortal(portal, defaultPath);
  if (resolvedPortal) {
    setCookie("auth_portal", resolvedPortal, WEEK_SECONDS);
  }
};

export const markAuthenticatedSession = (): void => {
  setCookie("auth_status", "1", WEEK_SECONDS);
};

export const syncAuthPortalSession = (
  portal?: string | null,
  defaultPath?: string | null,
): void => {
  const resolvedPortal = resolveAuthPortal(portal, defaultPath);
  if (resolvedPortal) {
    setCookie("auth_portal", resolvedPortal, WEEK_SECONDS);
  }
};

export const clearAuthSession = (): void => {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("auth_status");
  deleteCookie("auth_portal");
  deleteCookie("auth_roles");

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("user");
  }
};

export const getValidAccessToken = (
  cookieSource?: string | null,
): string | null => {
  const token = getCookie("access_token", cookieSource);
  if (!token) return null;

  if (isJwtExpired(token)) {
    // Only clear the expired access_token — keep refresh_token and auth_status
    // so the auto-refresh interceptor in responseInterceptor.ts can still
    // rotate tokens when the next API call triggers a 401.
    if (typeof window !== "undefined") {
      deleteCookie("access_token");
    }
    return null;
  }

  return token;
};
