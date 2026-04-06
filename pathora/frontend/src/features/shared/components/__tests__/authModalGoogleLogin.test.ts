import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL,
  DEFAULT_PRODUCTION_API_GATEWAY_BASE_URL,
  resolveApiGatewayBaseUrl,
} from "../../../../configs/apiGateway";

describe("AuthModal Google Login URL Construction", () => {
  it("uses configured API gateway when provided", () => {
    const apiGateway = resolveApiGatewayBaseUrl("https://api.pathora.com");
    const googleLoginUrl = `${apiGateway}/api/auth/google-login`;

    expect(googleLoginUrl).toBe("https://api.pathora.com/api/auth/google-login");
    expect(googleLoginUrl).not.toContain("undefined");
  });

  it("trims trailing slash from configured API gateway", () => {
    const apiGateway = resolveApiGatewayBaseUrl("https://api.pathora.com/");
    const googleLoginUrl = `${apiGateway}/api/auth/google-login`;

    expect(apiGateway).toBe("https://api.pathora.com");
    expect(googleLoginUrl).toBe("https://api.pathora.com/api/auth/google-login");
  });

  it("falls back to development default when API gateway is missing in dev", () => {
    const apiGateway = resolveApiGatewayBaseUrl(undefined, "development");
    const googleLoginUrl = `${apiGateway}/api/auth/google-login`;

    expect(apiGateway).toBe(DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL);
    expect(googleLoginUrl).toBe(
      `${DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL}/api/auth/google-login`,
    );
  });

  it("falls back to production API domain when API gateway is missing in prod", () => {
    const apiGateway = resolveApiGatewayBaseUrl(undefined, "production");

    expect(apiGateway).toBe(DEFAULT_PRODUCTION_API_GATEWAY_BASE_URL);
    expect(apiGateway).not.toContain("localhost");
  });
});
