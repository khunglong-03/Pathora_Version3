import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAdminPortal,
  isLoginEntryPath,
  USER_DEFAULT_PATH,
} from "./utils/authRouting";
// Role names generated from role.json — single source of truth
import { ADMIN_ROLE_NAMES, HOTELSERVICEPROVIDER_ROLE_NAMES, MANAGER_ROLE_NAMES } from "./auth-roles";

const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
const DEFAULT_LANGUAGE = "en";

function normalizeLanguage(lang: string): string {
  const code = lang.toLowerCase().split("-")[0].split(";")[0];
  return SUPPORTED_LANGUAGES.includes(code as "en" | "vi")
    ? code
    : DEFAULT_LANGUAGE;
}

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/home",
  "/tour-detail",
  "/about",
  "/visa",
  "/policies",
  "/checkout",
  "/auth/callback",
  "/tours",
  "/tours/instances",
];

const isPublicPath = (pathname: string): boolean => {
  if (pathname.startsWith("/tours/custom")) {
    return false;
  }

  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const STATIC_MEDIA_REGEX =
  /\.(mp4|webm|mov|ogg|mp3|wav|flac|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico|avif)$/i;

const parseAuthRoles = (cookieValue: string | undefined): string[] => {
  if (!cookieValue) return [];
  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as string[];
  } catch {
    return [];
  }
};

const hasAdminRole = (roles: string[]): boolean =>
  roles.some((role) => ADMIN_ROLE_NAMES.has(role));

const hasManagerRole = (roles: string[]): boolean =>
  roles.some((role) => MANAGER_ROLE_NAMES.has(role));

const hasHotelServiceProviderRole = (roles: string[]): boolean =>
  roles.some((role) => HOTELSERVICEPROVIDER_ROLE_NAMES.has(role));


const isManagerRoutePath = (pathname: string): boolean => {
  const MANAGER_ROUTE_PREFIXES = [
    "/dashboard",
    "/tour-management",
    "/tour-instances",
    "/tour-requests",
    "/pricing-policies",
    "/tax-configs",
  ];
  return MANAGER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const PROVIDER_ROUTE_PREFIXES = ["/transport", "/hotel"];

const isProviderRoutePath = (pathname: string): boolean =>
  PROVIDER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_MEDIA_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const existingLang = request.cookies.get("i18next")?.value;
  if (!existingLang) {
    const acceptLang = request.headers.get("accept-language");
    const detectedLang = acceptLang ? normalizeLanguage(acceptLang) : DEFAULT_LANGUAGE;
    const response = NextResponse.next();
    response.cookies.set("i18next", detectedLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const authStatus = request.cookies.get("auth_status")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const authPortal = request.cookies.get("auth_portal")?.value;
  const authRolesRaw = request.cookies.get("auth_roles")?.value;
  const { searchParams } = request.nextUrl;

  const authenticated = Boolean(authStatus || accessToken);
  const adminPortal = isAdminPortal(authPortal);
  const authRoles = parseAuthRoles(authRolesRaw);
  const publicPath = isPublicPath(pathname);

  if (authenticated && adminPortal && isLoginEntryPath(pathname, searchParams)) {
    if (hasAdminRole(authRoles)) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }
    if (hasManagerRole(authRoles)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (hasHotelServiceProviderRole(authRoles)) {
      return NextResponse.redirect(new URL("/hotel", request.url));
    }
    return NextResponse.redirect(new URL(USER_DEFAULT_PATH, request.url));
  }

  if (authenticated) {
    if (hasManagerRole(authRoles) && pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (hasAdminRole(authRoles) && isManagerRoutePath(pathname)) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }

    if (hasManagerRole(authRoles) && pathname.startsWith("/dashboard/customers")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      hasHotelServiceProviderRole(authRoles) &&
      !isProviderRoutePath(pathname) &&
      !isAdminRoutePath(pathname) &&
      !isManagerRoutePath(pathname)
    ) {
      return NextResponse.redirect(new URL("/hotel", request.url));
    }

  }

  if (!authenticated && !publicPath) {
    const loginUrl = new URL(USER_DEFAULT_PATH, request.url);
    loginUrl.searchParams.set("login", "true");
    const nextDestination = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    loginUrl.searchParams.set("next", nextDestination);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
