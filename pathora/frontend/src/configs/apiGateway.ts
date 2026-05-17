export const DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL =
  "http://localhost:5182";
export const DEFAULT_PRODUCTION_API_GATEWAY_BASE_URL =
  "https://api.vivugo.me";

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const resolveDefaultApiGatewayBaseUrl = (nodeEnv = process.env.NODE_ENV): string => {
  return nodeEnv === "production"
    ? DEFAULT_PRODUCTION_API_GATEWAY_BASE_URL
    : DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL;
};

// Explicit empty string ("") means same-origin: relative URL in the browser,
// internal nginx URL during SSR (Next can't fetch relative on the server).
const SSR_INTERNAL_GATEWAY = "http://nginx:8080";

export const resolveApiGatewayBaseUrl = (
  configuredValue: string | undefined = process.env.NEXT_PUBLIC_API_GATEWAY,
  nodeEnv = process.env.NODE_ENV,
): string => {
  // `undefined` (env var not set) → fall back to the per-NODE_ENV default.
  // Empty string (`NEXT_PUBLIC_API_GATEWAY=`) is an explicit opt-in for same-origin.
  if (configuredValue === "") {
    return typeof window === "undefined" ? SSR_INTERNAL_GATEWAY : "";
  }

  const trimmed = configuredValue?.trim();
  if (trimmed && trimmed.length > 0) {
    // In Server-Side Rendering (SSR) inside Docker, 'localhost' points to the container itself.
    // Rewrite host -> 'nginx' (docker service name) AND force the container-side port 8080
    // because the host-published port (e.g. 8099) doesn't exist on the docker network.
    if (typeof window === "undefined" && trimmed.includes("localhost")) {
      const rewritten = trimmed.replace(/localhost(?::\d+)?/, "nginx:8080");
      return normalizeBaseUrl(rewritten);
    }
    return normalizeBaseUrl(trimmed);
  }

  return resolveDefaultApiGatewayBaseUrl(nodeEnv);
};

export const API_GATEWAY_BASE_URL = resolveApiGatewayBaseUrl();
export const GOOGLE_LOGIN_URL = `${API_GATEWAY_BASE_URL}/api/auth/google-login`;
