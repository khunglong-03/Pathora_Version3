import axios from "axios";

import { API_GATEWAY_BASE_URL } from "@/configs/apiGateway";
import { getCookie } from "@/utils/cookie";

let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

// ─── Cross-tab BroadcastChannel coordination ──────────────────────────────
const CHANNEL_NAME = "auth-refresh";
const STORAGE_KEY = "auth-refresh-stamp";

type BroadcastPayload =
  | { type: "refresh-start"; ts: number }
  | { type: "refresh-done"; accessToken: string; ts: number }
  | { type: "refresh-fail"; ts: number };

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

function broadcast(payload: BroadcastPayload): void {
  if (channel) {
    channel.postMessage(payload);
  } else {
    // Fallback: Safari <15.4 / Private mode
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Private mode may disable localStorage — skip cross-tab sync
    }
  }
}

function resolveQueue(accessToken: string): void {
  const q = refreshQueue;
  refreshQueue = [];
  isRefreshing = false;
  q.forEach(({ resolve }) => resolve(accessToken));
}

function rejectQueue(err: unknown): void {
  const q = refreshQueue;
  refreshQueue = [];
  isRefreshing = false;
  q.forEach(({ reject }) => reject(err));
}

// Handle messages from other tabs
if (channel) {
  channel.addEventListener("message", (event: MessageEvent<BroadcastPayload>) => {
    const payload = event.data;
    if (payload.type === "refresh-start") {
      // Another tab is refreshing — mark local as refreshing so incoming 401s queue
      if (!isRefreshing) {
        isRefreshing = true;
      }
    } else if (payload.type === "refresh-done") {
      if (isRefreshing) {
        resolveQueue(payload.accessToken);
      }
    } else if (payload.type === "refresh-fail") {
      if (isRefreshing) {
        rejectQueue(new Error("refresh failed in another tab"));
      }
    }
  });
}

// localStorage fallback listener for Safari <15.4
if (!channel && typeof window !== "undefined") {
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue) as BroadcastPayload;
      if (payload.type === "refresh-start" && !isRefreshing) {
        isRefreshing = true;
      } else if (payload.type === "refresh-done" && isRefreshing) {
        resolveQueue(payload.accessToken);
      } else if (payload.type === "refresh-fail" && isRefreshing) {
        rejectQueue(new Error("refresh failed in another tab"));
      }
    } catch {
      // ignore malformed storage entries
    }
  });
}

// ─── Race tolerance for 404 NotFound ──────────────────────────────────────

async function handleRefreshError(err: unknown, oldAccessTokenSnapshot: string | null): Promise<{ accessToken: string }> {
  const isAxiosError = axios.isAxiosError(err);
  if (isAxiosError && err.response?.status === 404) {
    // Another tab may have already rotated the token. Wait for Set-Cookie propagation.
    await new Promise<void>((r) => setTimeout(r, 100));
    const newCookie = getCookie("access_token");
    if (newCookie && newCookie !== oldAccessTokenSnapshot) {
      // Token was rotated by another tab — use it
      return { accessToken: newCookie };
    }
  }
  throw err;
}

// ─── Core refresh logic ───────────────────────────────────────────────────

async function fetchNewAccessTokenFromApi(): Promise<{ accessToken: string; refreshToken?: string }> {
  // Always POST empty body — backend reads refresh_token from HttpOnly cookie.
  const response = await axios.post<{ data: { accessToken: string; refreshToken?: string } }>(
    "/api/auth/refresh",
    {},
    {
      baseURL: API_GATEWAY_BASE_URL,
      withCredentials: true,
    },
  );
  return response.data.data;
}

/**
 * Serializes refresh across same-tab concurrent requests and coordinates with
 * other tabs via BroadcastChannel (or localStorage fallback). Backend is the
 * sole owner of access_token and refresh_token cookies — this function never
 * writes cookies.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    const oldToken = getCookie("access_token");
    const ts = Date.now();
    broadcast({ type: "refresh-start", ts });

    try {
      const tokens = await fetchNewAccessTokenFromApi();
      broadcast({ type: "refresh-done", accessToken: tokens.accessToken, ts });
      resolveQueue(tokens.accessToken);
      return tokens.accessToken;
    } catch (err) {
      let result: { accessToken: string } | null = null;
      try {
        result = await handleRefreshError(err, oldToken);
      } catch {
        broadcast({ type: "refresh-fail", ts });
        rejectQueue(err);
        throw err;
      }
      broadcast({ type: "refresh-done", accessToken: result.accessToken, ts });
      resolveQueue(result.accessToken);
      return result.accessToken;
    }
  }

  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}
