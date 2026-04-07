export const DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL =
  "http://localhost:5812";
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
    return normalizeBaseUrl(trimmed);
  }

  return resolveDefaultApiGatewayBaseUrl(nodeEnv);
};

export const API_GATEWAY_BASE_URL = resolveApiGatewayBaseUrl();
export const GOOGLE_LOGIN_URL = `${API_GATEWAY_BASE_URL}/api/auth/google-login`;
