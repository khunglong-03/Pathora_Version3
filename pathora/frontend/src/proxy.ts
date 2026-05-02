import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAdminPortal,
  isLoginEntryPath,
  USER_DEFAULT_PATH,
} from "./utils/authRouting";
// Role names generated from role.json — single source of truth
import { ADMIN_ROLE_NAMES, HOTELSERVICEPROVIDER_ROLE_NAMES, MANAGER_ROLE_NAMES, TOUROPERATOR_ROLE_NAMES, TOURGUIDE_ROLE_NAMES } from "./auth-roles";

// TRANSPORTPROVIDER_ROLE_NAMES — not in generated auth-roles.ts, define here
const TRANSPORTPROVIDER_ROLE_NAMES = new Set(["TransportProvider"]);

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
  "/tour-detail",
  "/about",
  "/visa",
  "/policies",
  "/checkout",
  "/checkout-request",
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
    const decoded = decodeURIComponent(cookieValue);
    const roles = JSON.parse(decoded) as string[];
    
    // Debug log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[middleware] parseAuthRoles:", { cookieValue, decoded, roles });
    }
    
    return roles;
  } catch (error) {
    console.error("[middleware] Failed to parse auth_roles cookie:", error);
    return [];
  }
};

const hasAdminRole = (roles: string[]): boolean =>
  roles.some((role) => ADMIN_ROLE_NAMES.has(role));

const hasManagerRole = (roles: string[]): boolean =>
  roles.some((role) => MANAGER_ROLE_NAMES.has(role));

const hasHotelServiceProviderRole = (roles: string[]): boolean =>
  roles.some((role) => HOTELSERVICEPROVIDER_ROLE_NAMES.has(role));

const hasTransportProviderRole = (roles: string[]): boolean =>
  roles.some((role) => TRANSPORTPROVIDER_ROLE_NAMES.has(role));

const hasTourOperatorRole = (roles: string[]): boolean =>
  roles.some((role) => TOUROPERATOR_ROLE_NAMES.has(role));

const hasTourGuideRole = (roles: string[]): boolean =>
  roles.some((role) => TOURGUIDE_ROLE_NAMES.has(role));

const isManagerRoutePath = (pathname: string): boolean => {
  const MANAGER_ROUTE_PREFIXES = [
    "/manager",
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
const TOUR_OPERATOR_ROUTE_PREFIXES = ["/tour-operator"];
const TOUR_GUIDE_ROUTE_PREFIXES = ["/tour-guide"];
const AUTH_COOKIE_NAMES = [
  "access_token",
  "refresh_token",
  "auth_status",
  "auth_portal",
  "auth_roles",
] as const;

const isProviderRoutePath = (pathname: string): boolean =>
  PROVIDER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isTourOperatorRoutePath = (pathname: string): boolean =>
  TOUR_OPERATOR_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isTourGuideRoutePath = (pathname: string): boolean =>
  TOUR_GUIDE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isAdminRoutePath = (pathname: string): boolean =>
  pathname === "/admin" || pathname.startsWith("/admin/");

const clearAuthCookies = (response: NextResponse): void => {
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.delete(name);
  });
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_MEDIA_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const existingLang = request.cookies.get("i18next")?.value;
  const acceptLang = request.headers.get("accept-language");
  const detectedLang = existingLang
    ? null
    : acceptLang
      ? normalizeLanguage(acceptLang)
      : DEFAULT_LANGUAGE;
  const finalizeResponse = (response: NextResponse): NextResponse => {
    if (detectedLang) {
      response.cookies.set("i18next", detectedLang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  };
  const redirectTo = (path: string): NextResponse =>
    finalizeResponse(NextResponse.redirect(new URL(path, request.url)));

  const authStatus = request.cookies.get("auth_status")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const authPortal = request.cookies.get("auth_portal")?.value;
  const authRolesRaw = request.cookies.get("auth_roles")?.value;
  const { searchParams } = request.nextUrl;

  // Production fix: access_token/refresh_token are set by api.vivugo.me (different domain),
  // so Edge middleware cannot read them. auth_status IS set by frontend JS via
  // persistAuthSession() on the frontend domain → use it as the primary auth signal.
  const authenticated = Boolean(authStatus || accessToken || refreshToken);
  // hasStaleAuthMarker removed: on production, accessToken is always undefined in Edge
  // middleware context (wrong domain), so the stale check would always fire and
  // incorrectly clear valid sessions. Token expiry is handled by axiosInstance 401 → refresh.
  const adminPortal = isAdminPortal(authPortal);
  const authRoles = parseAuthRoles(authRolesRaw);
  const publicPath = isPublicPath(pathname);

  // Debug log in development
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/transport")) {
    console.log("[middleware] /transport route check:", {
      pathname,
      authenticated,
      adminPortal,
      authRoles,
      hasTransportProviderRole: hasTransportProviderRole(authRoles),
      publicPath,
    });
  }

  if (authenticated && isLoginEntryPath(pathname, searchParams)) {
    if (hasAdminRole(authRoles)) {
      return redirectTo("/admin/users");
    }
    if (hasManagerRole(authRoles)) {
      return redirectTo("/manager");
    }
    if (hasHotelServiceProviderRole(authRoles)) {
      return redirectTo("/hotel");
    }
    if (hasTransportProviderRole(authRoles)) {
      return redirectTo("/transport");
    }
    if (hasTourOperatorRole(authRoles)) {
      return redirectTo("/tour-operator");
    }
    if (hasTourGuideRole(authRoles)) {
      return redirectTo("/tour-guide");
    }
    // Regular customers have no specific dashboard and should stay on the home page
  }

  if (authenticated) {
    // Role-based redirects to prevent unauthorized access
    
    // Managers can't access admin routes
    if (hasManagerRole(authRoles) && pathname.startsWith("/admin/")) {
      return redirectTo("/manager");
    }

    // Admins can't access manager routes
    if (hasAdminRole(authRoles) && isManagerRoutePath(pathname)) {
      return redirectTo("/admin/users");
    }

    // Managers can't access customer routes
    if (hasManagerRole(authRoles) && pathname.startsWith("/manager/customers")) {
      return redirectTo("/manager");
    }

    // Hotel providers must stay in hotel routes
    if (
      hasHotelServiceProviderRole(authRoles) &&
      !isProviderRoutePath(pathname) &&
      !isAdminRoutePath(pathname) &&
      !isManagerRoutePath(pathname)
    ) {
      return redirectTo("/hotel");
    }

    // Transport providers must stay in transport routes (except public paths)
    if (
      hasTransportProviderRole(authRoles) && 
      !isProviderRoutePath(pathname) && 
      !isAdminRoutePath(pathname) &&
      !isManagerRoutePath(pathname) &&
      !publicPath
    ) {
      return redirectTo("/transport");
    }

    // Block non-transport-providers from accessing /transport routes
    if (pathname.startsWith("/transport/") && !hasTransportProviderRole(authRoles)) {
      if (hasAdminRole(authRoles)) {
        return redirectTo("/admin/users");
      }
      if (hasManagerRole(authRoles)) {
        return redirectTo("/manager");
      }
      if (hasHotelServiceProviderRole(authRoles)) {
        return redirectTo("/hotel");
      }
      return redirectTo("/");
    }

    // Block non-hotel-providers from accessing /hotel routes
    if (pathname.startsWith("/hotel/") && !hasHotelServiceProviderRole(authRoles)) {
      if (hasAdminRole(authRoles)) {
        return redirectTo("/admin/users");
      }
      if (hasManagerRole(authRoles)) {
        return redirectTo("/manager");
      }
      if (hasTransportProviderRole(authRoles)) {
        return redirectTo("/transport");
      }
      if (hasTourOperatorRole(authRoles)) {
        return redirectTo("/tour-operator");
      }
      if (hasTourGuideRole(authRoles)) {
        return redirectTo("/tour-guide");
      }
      return redirectTo("/");
    }

    // Tour Operators must stay in tour-operator routes (except public paths)
    if (
      hasTourOperatorRole(authRoles) &&
      !isTourOperatorRoutePath(pathname) &&
      !publicPath
    ) {
      return redirectTo("/tour-operator");
    }

    // Tour Guides must stay in tour-guide routes (except public paths)
    if (
      hasTourGuideRole(authRoles) &&
      !isTourGuideRoutePath(pathname) &&
      !publicPath
    ) {
      return redirectTo("/tour-guide");
    }

    // Block non-tour-operators from accessing /tour-operator routes
    if (pathname.startsWith("/tour-operator") && !hasTourOperatorRole(authRoles)) {
      if (hasManagerRole(authRoles)) {
        return redirectTo("/manager");
      }
      if (hasAdminRole(authRoles)) {
        return redirectTo("/admin/users");
      }
      if (hasHotelServiceProviderRole(authRoles)) {
        return redirectTo("/hotel");
      }
      if (hasTransportProviderRole(authRoles)) {
        return redirectTo("/transport");
      }
      if (hasTourGuideRole(authRoles)) {
        return redirectTo("/tour-guide");
      }
      return redirectTo("/");
    }

    // Block TourOperator from accessing /manager/* and /admin/* routes
    if (hasTourOperatorRole(authRoles)) {
      if (pathname.startsWith("/manager/") || pathname === "/manager") {
        return redirectTo("/tour-operator/tours");
      }
      if (pathname.startsWith("/admin/") || pathname === "/admin") {
        return redirectTo("/tour-operator/tours");
      }
    }

    // Block non-tour-guides from accessing /tour-guide routes
    if (pathname.startsWith("/tour-guide") && !hasTourGuideRole(authRoles)) {
      return redirectTo("/");
    }

  }

  if (!authenticated && !publicPath) {
    const loginUrl = new URL(USER_DEFAULT_PATH, request.url);
    loginUrl.searchParams.set("login", "true");
    // Strip `login`/`next` so repeated middleware redirects don't nest
    // `?next=%2F%3Fnext%3D%252F...` infinitely.
    const cleanedParams = new URLSearchParams(searchParams);
    cleanedParams.delete("login");
    cleanedParams.delete("next");
    const cleanedSearch = cleanedParams.toString();
    const nextDestination = pathname + (cleanedSearch ? `?${cleanedSearch}` : "");
    if (nextDestination !== USER_DEFAULT_PATH) {
      loginUrl.searchParams.set("next", nextDestination);
    }
    return finalizeResponse(NextResponse.redirect(loginUrl));
  }

  return finalizeResponse(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
