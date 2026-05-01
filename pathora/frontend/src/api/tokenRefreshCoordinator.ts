import axios from "axios";

import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { DAY_SECONDS } from "@/utils/authSession";
import { setCookie } from "@/utils/cookie";

let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

import { getCookie } from "@/utils/cookie";

async function fetchNewAccessTokenFromApi(): Promise<string> {
  const refreshToken = getCookie("refresh_token");
  const response = await axios.post<{ data: { accessToken: string } }>(
    "/api/auth/refresh",
    // Only include refreshToken in body if the cookie is readable (non-HttpOnly).
    // Otherwise send empty body so backend falls back to reading the HttpOnly cookie.
    refreshToken ? { refreshToken } : {},
    {
      baseURL: API_GATEWAY_BASE_URL,
      withCredentials: true,
    },
  );
  return response.data.data.accessToken;
}

function persistAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") {
    return;
  }
  setCookie("access_token", token, DAY_SECONDS);
}

/**
 * Serializes refresh: one in-flight POST /api/auth/refresh; waiters share the result.
 * Sets access_token cookie with DAY_SECONDS (aligned with login).
 */
export async function refreshAccessToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const newToken = await fetchNewAccessTokenFromApi();
      persistAccessTokenCookie(newToken);
      const q = refreshQueue;
      refreshQueue = [];
      isRefreshing = false;
      q.forEach(({ resolve }) => {
        resolve(newToken);
      });
      return newToken;
    } catch (err) {
      const q = refreshQueue;
      refreshQueue = [];
      isRefreshing = false;
      q.forEach(({ reject }) => {
        reject(err);
      });
      throw err;
    }
  }

  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}
