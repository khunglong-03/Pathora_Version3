import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { getCurrentApiLanguage } from "../../api/languageHeader";
import { getCookie } from "../../utils/cookie";
import { refreshAccessToken } from "@/api/tokenRefreshCoordinator";

const baseUrl = API_GATEWAY_BASE_URL;

export const prepareApiHeaders = (
  headers: Headers,
  cookieSource?: string | null,
  preferredLanguage?: string | null,
) => {
  const token = getCookie("access_token", cookieSource);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Accept-Language", getCurrentApiLanguage(preferredLanguage));
  return headers;
};

export const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers) => prepareApiHeaders(headers),
});

export function createBaseQueryWithReauth(
  baseQuery: typeof rawBaseQuery,
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  return async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
      return result;
    }

    const url = typeof args === "string" ? args : args.url;
    if (typeof url === "string" && url.includes("/auth/refresh")) {
      return result;
    }

    // Only attempt refresh when an auth_status cookie exists. On a fresh page
    // load with no session, the very first RTK query (e.g. getUserInfo) returns
    // 401 — refreshing then would fail again and redirect to /?login=true&next=…
    // before the user can even submit the login form, which is what made the
    // login + refresh requests "disappear" from the Network panel.
    const hasSession =
      typeof document !== "undefined" && Boolean(getCookie("auth_status"));
    if (!hasSession) {
      return result;
    }

    try {
      await refreshAccessToken();
    } catch {
      // Không xóa session — redirect về login để user re-authenticate.
      // Strip stale `login`/`next` so repeated 401s don't nest
      // `?next=%2F%3Fnext%3D%252F...` infinitely.
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("login");
        currentUrl.searchParams.delete("next");
        const cleanSearch = currentUrl.searchParams.toString();
        const currentPath =
          currentUrl.pathname + (cleanSearch ? `?${cleanSearch}` : "");

        const loginUrl = new URL("/", window.location.origin);
        loginUrl.searchParams.set("login", "true");
        if (currentPath !== "/") {
          loginUrl.searchParams.set("next", currentPath);
        }
        if (window.location.href !== loginUrl.toString()) {
          window.location.href = loginUrl.toString();
        }
      }
      return result;
    }

    result = await baseQuery(args, api, extraOptions);
    return result;
  };
}

/** Parity with axios: on 401, rotate access token then retry once (serialized via tokenRefreshCoordinator). */
export const baseQueryWithReauth = createBaseQueryWithReauth(rawBaseQuery);

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products", "Orders", "Customers", "Dashboard", "events", "Auth"],
  endpoints: () => ({}),
});
