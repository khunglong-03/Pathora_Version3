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

export const resolveApiGatewayBaseUrl = (
  configuredValue: string | undefined = process.env.NEXT_PUBLIC_API_GATEWAY,
  nodeEnv = process.env.NODE_ENV,
): string => {
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
