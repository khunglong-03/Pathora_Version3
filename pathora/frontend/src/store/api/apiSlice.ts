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
import { clearAuthSession } from "@/utils/authSession";

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

    try {
      await refreshAccessToken();
    } catch {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.location.href = "/";
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
