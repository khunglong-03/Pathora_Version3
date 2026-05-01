import axios from "axios";

import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { DAY_SECONDS } from "@/utils/authSession";
import { setCookie } from "@/utils/cookie";

let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

import { getCookie } from "@/utils/cookie";

async function fetchNewAccessTokenFromApi(): Promise<{ accessToken: string; refreshToken?: string }> {
  const refreshToken = getCookie("refresh_token");
  const response = await axios.post<{ data: { accessToken: string; refreshToken?: string } }>(
    "/api/auth/refresh",
    // Only include refreshToken in body if the cookie is readable (non-HttpOnly).
    // Otherwise send empty body so backend falls back to reading the HttpOnly cookie.
    refreshToken ? { refreshToken } : {},
    {
      baseURL: API_GATEWAY_BASE_URL,
      withCredentials: true,
    },
  );
  return response.data.data;
}

function persistTokens(accessToken: string, refreshToken?: string): void {
  if (typeof document === "undefined") {
    return;
  }
  setCookie("access_token", accessToken, DAY_SECONDS);
  if (refreshToken) {
    // 7 days in seconds for refresh token
    setCookie("refresh_token", refreshToken, DAY_SECONDS * 7);
  }
}

/**
 * Serializes refresh: one in-flight POST /api/auth/refresh; waiters share the result.
 * Sets access_token cookie with DAY_SECONDS (aligned with login).
 */
export async function refreshAccessToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const tokens = await fetchNewAccessTokenFromApi();
      persistTokens(tokens.accessToken, tokens.refreshToken);
      const q = refreshQueue;
      refreshQueue = [];
      isRefreshing = false;
      q.forEach(({ resolve }) => {
        resolve(tokens.accessToken);
      });
      return tokens.accessToken;
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
