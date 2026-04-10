import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAdminPortal,
  isLoginEntryPath,
  USER_DEFAULT_PATH,
} from "./utils/authRouting";
// Role names generated from role.json — single source of truth
import { ADMIN_ROLE_NAMES, HOTELSERVICEPROVIDER_ROLE_NAMES, MANAGER_ROLE_NAMES, TOURDESIGNER_ROLE_NAMES, TOURGUIDE_ROLE_NAMES } from "./auth-roles";

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

const hasTourDesignerRole = (roles: string[]): boolean =>
  roles.some((role) => TOURDESIGNER_ROLE_NAMES.has(role));

const hasTourGuideRole = (roles: string[]): boolean =>
  roles.some((role) => TOURGUIDE_ROLE_NAMES.has(role));const isManagerRoutePath = (pathname: string): boolean => {
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
const TOUR_DESIGNER_ROUTE_PREFIXES = ["/tour-designer"];
const TOUR_GUIDE_ROUTE_PREFIXES = ["/tour-guide"];

const isProviderRoutePath = (pathname: string): boolean =>
  PROVIDER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isTourDesignerRoutePath = (pathname: string): boolean =>
  TOUR_DESIGNER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isTourGuideRoutePath = (pathname: string): boolean =>
  TOUR_GUIDE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const isAdminRoutePath = (pathname: string): boolean =>
  pathname === "/admin" || pathname.startsWith("/admin/");

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

  if (authenticated && adminPortal && isLoginEntryPath(pathname, searchParams)) {
    if (hasAdminRole(authRoles)) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }
    if (hasManagerRole(authRoles)) {
      return NextResponse.redirect(new URL("/manager", request.url));
    }
    if (hasHotelServiceProviderRole(authRoles)) {
      return NextResponse.redirect(new URL("/hotel", request.url));
    }
    if (hasTransportProviderRole(authRoles)) {
      return NextResponse.redirect(new URL("/transport", request.url));
    }
    if (hasTourDesignerRole(authRoles)) {
      return NextResponse.redirect(new URL("/tour-designer", request.url));
    }
    if (hasTourGuideRole(authRoles)) {
      return NextResponse.redirect(new URL("/tour-guide", request.url));
    }
    return NextResponse.redirect(new URL(USER_DEFAULT_PATH, request.url));
  }

  if (authenticated) {
    // Role-based redirects to prevent unauthorized access
    
    // Managers can't access admin routes
    if (hasManagerRole(authRoles) && pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/manager", request.url));
    }

    // Admins can't access manager routes
    if (hasAdminRole(authRoles) && isManagerRoutePath(pathname)) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }

    // Managers can't access customer routes
    if (hasManagerRole(authRoles) && pathname.startsWith("/manager/customers")) {
      return NextResponse.redirect(new URL("/manager", request.url));
    }

    // Hotel providers must stay in hotel routes
    if (
      hasHotelServiceProviderRole(authRoles) &&
      !isProviderRoutePath(pathname) &&
      !isAdminRoutePath(pathname) &&
      !isManagerRoutePath(pathname)
    ) {
      return NextResponse.redirect(new URL("/hotel", request.url));
    }

    // Transport providers must stay in transport routes (except public paths)
    if (
      hasTransportProviderRole(authRoles) && 
      !isProviderRoutePath(pathname) && 
      !isAdminRoutePath(pathname) &&
      !isManagerRoutePath(pathname) &&
      !publicPath
    ) {
      return NextResponse.redirect(new URL("/transport", request.url));
    }

    // Block non-transport-providers from accessing /transport routes
    if (pathname.startsWith("/transport/") && !hasTransportProviderRole(authRoles)) {
      if (hasAdminRole(authRoles)) {
        return NextResponse.redirect(new URL("/admin/users", request.url));
      }
      if (hasManagerRole(authRoles)) {
        return NextResponse.redirect(new URL("/manager", request.url));
      }
      if (hasHotelServiceProviderRole(authRoles)) {
        return NextResponse.redirect(new URL("/hotel", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Block non-hotel-providers from accessing /hotel routes
    if (pathname.startsWith("/hotel/") && !hasHotelServiceProviderRole(authRoles)) {
      if (hasAdminRole(authRoles)) {
        return NextResponse.redirect(new URL("/admin/users", request.url));
      }
      if (hasManagerRole(authRoles)) {
        return NextResponse.redirect(new URL("/manager", request.url));
      }
      if (hasTransportProviderRole(authRoles)) {
        return NextResponse.redirect(new URL("/transport", request.url));
      }
      if (hasTourDesignerRole(authRoles)) {
        return NextResponse.redirect(new URL("/tour-designer", request.url));
      }
      if (hasTourGuideRole(authRoles)) {
        return NextResponse.redirect(new URL("/tour-guide", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Tour Designers must stay in tour-designer routes (except public paths)
    if (
      hasTourDesignerRole(authRoles) &&
      !isTourDesignerRoutePath(pathname) &&
      !publicPath
    ) {
      return NextResponse.redirect(new URL("/tour-designer", request.url));
    }

    // Tour Guides must stay in tour-guide routes (except public paths)
    if (
      hasTourGuideRole(authRoles) &&
      !isTourGuideRoutePath(pathname) &&
      !publicPath
    ) {
      return NextResponse.redirect(new URL("/tour-guide", request.url));
    }

    // Block non-tour-designers from accessing /tour-designer routes
    if (pathname.startsWith("/tour-designer") && !hasTourDesignerRole(authRoles)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Block non-tour-guides from accessing /tour-guide routes
    if (pathname.startsWith("/tour-guide") && !hasTourGuideRole(authRoles)) {
      return NextResponse.redirect(new URL("/", request.url));
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
