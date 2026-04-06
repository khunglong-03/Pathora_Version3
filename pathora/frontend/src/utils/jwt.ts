type JwtPayload = {
  exp?: number;
};

const decodeBase64 = (value: string): string | null => {
  const decode = globalThis.atob;
  if (typeof decode === "function") {
    return decode(value);
  }

  const bufferCtor = (
    globalThis as {
      Buffer?: {
        from: (
          input: string,
          encoding: string,
        ) => { toString: (encoding?: string) => string };
      };
    }
  ).Buffer;

  if (!bufferCtor?.from) {
    return null;
  }

  return bufferCtor.from(value, "base64").toString("utf-8");
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = decodeBase64(padded);
    if (!decoded) return null;

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string, nowMs = Date.now()): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= nowMs;
};
