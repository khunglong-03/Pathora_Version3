export const getCookie = (
  name: string,
  cookieSource?: string | null,
): string | null => {
  const cookieValue =
    cookieSource ?? (typeof document !== "undefined" ? document.cookie : null);
  if (!cookieValue) return null;

  const value = `; ${cookieValue}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
};

export const deleteCookie = (name: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

export const setCookie = (
  name: string,
  value: string,
  maxAgeSeconds: number,
): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};
