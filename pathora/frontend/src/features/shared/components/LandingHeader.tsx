"use client";
import React, {
  Fragment,
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Image from "./LandingImage";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import LandingLogo from "@/assets/images/logo/pathora-logo.svg";
import dynamic from "next/dynamic";
import { Transition, TransitionChild } from "@headlessui/react";

const AuthModal = dynamic(
  () => import("./AuthModal").then((m) => m.AuthModal),
  { ssr: false },
);
import { useTranslation } from "react-i18next";
import useMobileMenu from "@/hooks/useMobileMenu";
import useWidth from "@/hooks/useWidth";
import type { RootState } from "@/store";
import { useSelector, useDispatch } from "react-redux";
import { handleCustomizer } from "@/store/layout";
import { logOut } from "@/store/infrastructure/authSlice";
import { useLogoutMutation } from "@/store/api/auth/authApiSlice";
import {
  FiGlobe,
  FiChevronDown,
  FiCheck,
  FiSliders,
  FiClipboard,
  FiLogOut,
  FiMenu,
  FiX,
  FiCalendar,
  FiArrowRight,
  FiUser,
  FiSettings,
  FiLock,
} from "react-icons/fi";
import { bookingService, RecentBooking } from "@/api/services/bookingService";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

const LOGO = LandingLogo;

const navLinks = [
  { labelKey: "landing.nav.home", href: "/" },
  { labelKey: "landing.nav.aboutUs", href: "/about" },
  { labelKey: "landing.nav.tourPackages", href: "/tours" },
  { labelKey: "landing.nav.ourPolicies", href: "/policies" },
];

const sidebarLinks = [
  {
    labelKey: "landing.nav.home",
    href: "/",
    icon: "heroicons-outline:home",
  },
  {
    labelKey: "landing.sidebar.tourDiscovery",
    href: "/tours",
    icon: "heroicons-outline:globe-alt",
  },
  {
    labelKey: "landing.nav.aboutUs",
    href: "/about",
    icon: "heroicons-outline:users",
  },
  {
    labelKey: "landing.nav.ourPolicies",
    href: "/policies",
    icon: "heroicons-outline:document-text",
  },
];

const configuredRemoteImageHosts = new Set(
  (process.env.NEXT_PUBLIC_REMOTE_IMAGE_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        const normalized = entry.includes("://")
          ? entry
          : `https://${entry.replace(/^\/\//, "")}`;
        return new URL(normalized).hostname.toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean),
);

const canUseNextImage = (src: string) => {
  try {
    const url = new URL(src);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return configuredRemoteImageHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const AvatarImage = ({
  src,
  alt,
  size,
}: {
  src: string;
  alt: string;
  size: number;
}) => {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element -- fallback for non-allowlisted user avatar hosts */
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover"
    />
  );
};

/* ── Mobile Sidebar Drawer ─────────────────────────────────── */
const MobileSidebar = ({
  open,
  onClose,
  onOpenAuth,
  dialogId,
  logoVariant = "svg",
}: {
  open: boolean;
  onClose: () => void;
  onOpenAuth: (view: "signup" | "login" | "forgot") => void;
  dialogId: string;
  logoVariant?: "svg" | "text";
}) => {
  const { t, i18n } = useTranslation();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);
  const panelRef = useRef<HTMLDivElement>(null);
  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .split("-")[0];

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;
    const selectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(selectors),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const menuTitleId = `${dialogId}-title`;

  return (
    <Transition show={open} as={Fragment}>
      <div className="fixed inset-0 z-50 md:hidden">
        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-300 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="transform transition duration-300 ease-out"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition duration-200 ease-in"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div
            ref={panelRef}
            id={dialogId}
            className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#1a1a1a] flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={menuTitleId}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3"
              >
                {logoVariant === "text" ? (
                  <span className="text-xl font-bold text-white font-['Space_Grotesk']">
                    Pathora
                  </span>
                ) : (
                  <>
                    <div className="relative h-10 w-12">
                      <Image
                        src={LOGO}
                        alt="Pathora logo"
                        fill
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-xl font-bold text-white">
                      Pathora
                    </span>
                  </>
                )}
              </Link>
              <Button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors bg-transparent"
                icon="heroicons-outline:x"
                iconClass="text-xl text-white"
                ariaLabel={t("landing.a11y.closeMenu")}
              />
            </div>

            {/* User info */}
            {isAuth && (
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#fa8b02] flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <AvatarImage
                      src={user.avatar}
                      alt={user?.fullName ?? "User"}
                      size={40}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {(user?.fullName || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-4" aria-label="Sidebar">
              {sidebarLinks.map((item) => (
                <div key={item.labelKey}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all group"
                  >
                    <Icon
                      icon={item.icon}
                      className="w-5 h-5 text-gray-400 group-hover:text-[#fa8b02] transition-colors"
                    />
                    <span className="text-base text-gray-200 group-hover:text-white font-medium transition-colors">
                      {t(item.labelKey)}
                    </span>
                  </Link>
                </div>
              ))}

              {isAuth && (
                <div>
                  <Link
                    href="/bookings"
                    onClick={onClose}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all group"
                  >
                    <Icon
                      icon="heroicons-outline:calendar-days"
                      className="w-5 h-5 text-gray-400 group-hover:text-[#fa8b02] transition-colors"
                    />
                    <span className="text-base text-gray-200 group-hover:text-white font-medium transition-colors">
                      {t("booking.myBookings") || "Tour đã đặt"}
                    </span>
                  </Link>
                  <Link
                    href="/tours/my-requests"
                    onClick={onClose}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all group"
                  >
                    <Icon
                      icon="heroicons-outline:clipboard-document-list"
                      className="w-5 h-5 text-gray-400 group-hover:text-[#fa8b02] transition-colors"
                    />
                    <span className="text-base text-gray-200 group-hover:text-white font-medium transition-colors">
                      {t("tourRequest.page.myRequests.title") ||
                        "Yêu cầu thiết kế tour"}
                    </span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Language */}
            <div className="px-6 py-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">
                  {t("landing.language.title")}
                </span>
                <div className="flex rounded-full bg-white/10 p-0.5">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      type="button"
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        normalizedLanguage === lang.code
                          ? "bg-[#fa8b02] text-white"
                          : "text-gray-300 hover:text-white"
                      } min-h-9 min-w-14`}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      aria-pressed={normalizedLanguage === lang.code}
                    >
                      {lang.code.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isAuth && (
              <div className="flex gap-3 p-6 border-t border-white/10">
                <Button
                  onClick={() => onOpenAuth("login")}
                  text={t("common.signIn")}
                  className="flex-1 py-3 text-center text-white border border-white/20 rounded-full font-medium hover:bg-white/10 transition-all text-sm"
                />
                <Button
                  onClick={() => onOpenAuth("signup")}
                  text={t("common.signUp")}
                  className="flex-1 py-3 text-center bg-linear-to-r from-[#fa8b02] to-[#ff9f2d] text-white rounded-full font-medium hover:shadow-lg hover:shadow-[#fa8b02]/30 transition-all text-sm"
                />
              </div>
            )}
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
};

/* ── Header ────────────────────────────────────────────────── */
export const LandingHeader = () => {
  const pathname = usePathname();
  const isOverlayPage = pathname === "/" || pathname === "/about";
  const isSolid = !isOverlayPage;
  const { t, i18n } = useTranslation();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);
  const customizerOpen = useSelector(
    (state: RootState) => state.layout.customizer,
  );
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();
  const router = useRouter();

  // Scroll state for header shrink effect
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // useSyncExternalStore is the React-recommended way to detect client mount
  // without hydration mismatch — returns false on server, true on client
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Use mounted to prevent SSR/client hydration mismatch for auth state
  const clientIsAuth = mounted && isAuth;

  const handleLogout = async () => {
    setUserMenuOpen(false);
    const refreshToken =
      (typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((r) => r.startsWith("refresh_token="))
            ?.split("=")[1]
        : undefined) ?? "";
    try {
      await logout({ refreshToken }).unwrap();
    } catch {
      // logOut is dispatched inside the mutation's onQueryStarted
    }
    // Portal-aware redirect: admin portal → /, user portal → /
    const portal =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((c) => c.startsWith("auth_portal="))
            ?.split("=")[1]
        : undefined;
    router.push(portal === "admin" ? "/admin/dashboard" : "/");
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useMobileMenu();
  const { width, breakpoints } = useWidth();
  const mdBreakpoint = breakpoints.md;
  const searchParams = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"signup" | "login" | "forgot">(
    "signup",
  );

  useEffect(() => {
    if (searchParams.get("login") !== "true") return;

    // Clean up the URL regardless of auth state to prevent stuck URL param
    const url = new URL(window.location.href);
    url.searchParams.delete("login");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });

    // Check actual auth cookies — they survive longer than the JWT and prove
    // the user has a refreshable session.  ?login=true can arrive from
    // TourInstanceInfoCard (hydration race) as well as middleware, so we
    // must NOT blindly dispatch(logOut()) when cookies are still present.
    const hasAuthCookie =
      typeof document !== "undefined" &&
      document.cookie
        .split("; ")
        .some(
          (c) => c.startsWith("auth_status=") || c.startsWith("refresh_token="),
        );

    if (clientIsAuth || hasAuthCookie) {
      // User is still authenticated — do NOT wipe Redux or open the modal.
      return;
    }

    // Truly unauthenticated: sync Redux and show login modal
    dispatch(logOut());
    setAuthOpen(true);
    setAuthView("login");
  }, [searchParams, clientIsAuth, router, dispatch]);

  // If user becomes authenticated while modal is open, close it
  useEffect(() => {
    if (clientIsAuth && authOpen) {
      setAuthOpen(false);
    }
  }, [clientIsAuth, authOpen]);

  const effectiveAuthOpen = authOpen;
  const effectiveAuthView = authView;
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const wasMenuOpenRef = useRef(false);
  const languageMenuId = "landing-language-menu";
  const userMenuId = "landing-user-menu";
  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .split("-")[0];
  const userDisplayName = user?.fullName ?? user?.username ?? "";
  const userInitial = (userDisplayName || "U")[0].toUpperCase();
  const userAvatarAlt = userDisplayName
    ? `${userDisplayName} avatar`
    : "User avatar";

  const openAuth = (view: "signup" | "login" | "forgot") => {
    setAuthView(view);
    setAuthOpen(true);
    setMobileMenuOpen(false);
    setLanguageMenuOpen(false);
    setUserMenuOpen(false);
  };

  useEffect(() => {
    if (wasMenuOpenRef.current && !mobileMenuOpen) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen && width >= mdBreakpoint) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen, width, mdBreakpoint, setMobileMenuOpen]);

  useEffect(() => {
    if (!languageMenuOpen && !userMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        languageMenuOpen &&
        languageMenuRef.current &&
        !languageMenuRef.current.contains(target)
      ) {
        setLanguageMenuOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageMenuOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [languageMenuOpen, userMenuOpen]);

  // If user has any staff/provider roles, they are not a customer and shouldn't fetch bookings
  const isCustomer =
    !user?.roles?.length ||
    user.roles.every((r) => r.name.toLowerCase() === "customer");

  // Fetch recent bookings when user menu opens (Only for Customers)
  useEffect(() => {
    if (!clientIsAuth || !userMenuOpen || !isCustomer) return;

    const fetchRecentBookings = async () => {
      setBookingsLoading(true);
      try {
        const bookings = await bookingService.getRecentBookings(3);
        setRecentBookings(bookings);
      } catch (err) {
        console.error("[LandingHeader] getRecentBookings error:", err);
        setRecentBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchRecentBookings();
  }, [clientIsAuth, userMenuOpen, user?.roles]);

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "approved":
        return "bg-green-500/20 text-green-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
      case "pending_approval":
        return "bg-yellow-500/20 text-yellow-400";
      case "cancelled":
      case "rejected":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-[#fa8b02] focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isSolid
            ? "bg-[#1a1a1a] shadow-lg shadow-black/20"
            : scrolled
              ? "bg-[rgba(26,26,26,0.95)] backdrop-blur-xl shadow-lg shadow-black/20"
              : "bg-[rgba(26,26,26,0.7)] backdrop-blur-md"
        } ${scrolled ? "py-3" : "py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 group">
              <div
                className={`relative transition-all duration-300 ${scrolled ? "h-10 w-24" : "h-12 w-28"}`}
              >
                <Image
                  src={LOGO}
                  alt="Pathora logo"
                  fill
                  sizes="(max-width: 768px) 96px, 112px"
                  className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    onMouseEnter={() => router.prefetch(link.href)}
                    onFocus={() => router.prefetch(link.href)}
                    className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "text-[#fa8b02]"
                        : "text-white hover:text-[#fa8b02]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {mounted
                      ? t(link.labelKey)
                      : link.labelKey === "landing.nav.home"
                        ? "Home"
                        : link.labelKey === "landing.nav.aboutUs"
                          ? "About Us"
                          : link.labelKey === "landing.nav.tourPackages"
                            ? "Tours"
                            : link.labelKey === "landing.nav.ourPolicies"
                              ? "Docs"
                              : ""}
                    {/* Animated underline */}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#fa8b02] transition-all duration-300 ${
                        isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative" ref={languageMenuRef}>
                <Button
                  type="button"
                  suppressHydrationWarning
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                  onClick={() => {
                    setLanguageMenuOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  aria-label={`${t("landing.a11y.changeLanguage")} (${mounted ? normalizedLanguage.toUpperCase() : "EN"})`}
                  aria-haspopup="menu"
                  aria-expanded={languageMenuOpen}
                  aria-controls={languageMenuId}
                >
                  <FiGlobe
                    suppressHydrationWarning
                    className="w-4 h-4 text-white/70"
                  />
                  <span className="text-sm font-medium text-white">
                    {mounted ? normalizedLanguage.toUpperCase() : "EN"}
                  </span>
                  <FiChevronDown
                    suppressHydrationWarning
                    className={`w-3.5 h-3.5 text-white/50 transition-transform ${languageMenuOpen ? "rotate-180" : ""}`}
                  />
                </Button>
                {/* Language Dropdown */}
                <div
                  id={languageMenuId}
                  role="menu"
                  className={`absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#2a2a2a]/95 backdrop-blur-xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-200 ${
                    languageMenuOpen
                      ? "visible opacity-100 translate-y-0"
                      : "invisible opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  {languages.map((lang) => {
                    const isActive =
                      mounted && lang.code === normalizedLanguage;
                    return (
                      <Button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setLanguageMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/5 ${
                          isActive
                            ? "text-[#fa8b02] bg-[#fa8b02]/10"
                            : "text-white"
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{lang.label}</span>
                        {isActive && <FiCheck className="w-4 h-4 ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* User Menu - When Logged In */}
              {clientIsAuth && (
                <div className="relative" ref={userMenuRef}>
                  <Button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen((prev) => !prev);
                      setLanguageMenuOpen(false);
                    }}
                    className="w-10 h-10 rounded-full border-2 border-white/20 hover:border-[#fa8b02] overflow-hidden transition-all bg-[#333] flex items-center justify-center shrink-0 focus-visible:outline-none"
                    aria-label="User menu"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                  >
                    {user?.avatar ? (
                      <AvatarImage
                        src={user.avatar}
                        alt={userAvatarAlt}
                        size={40}
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {userInitial}
                      </span>
                    )}
                  </Button>

                  {/* User Dropdown */}
                  <div
                    id={userMenuId}
                    role="menu"
                    className={`absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#2a2a2a]/95 backdrop-blur-xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-200 ${
                      userMenuOpen
                        ? "visible opacity-100 translate-y-0"
                        : "invisible opacity-0 translate-y-2 pointer-events-none"
                    }`}
                  >
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-linear-to-r from-[#fa8b02] to-[#ff9f2d] flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.avatar ? (
                          <AvatarImage
                            src={user.avatar}
                            alt={userAvatarAlt}
                            size={40}
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {userInitial}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.fullName ?? user?.username ?? ""}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Recent Bookings */}
                    {recentBookings.length > 0 && (
                      <div className="border-t border-white/10">
                        <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {t("booking.recentBookings") || "Tour đã đặt"}
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {recentBookings.map((booking) => (
                            <Link
                              key={booking.bookingId}
                              href={`/bookings/${booking.bookingId}`}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex w-full items-start gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                            >
                              <FiCalendar className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {booking.tourName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      booking.departureDate,
                                    ).toLocaleDateString(
                                      i18n.language === "vi"
                                        ? "vi-VN"
                                        : "en-US",
                                      { day: "numeric", month: "short" },
                                    )}
                                  </span>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(
                                      booking.status,
                                    )}`}
                                  >
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                          <Link
                            href="/bookings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm text-[#fa8b02] hover:bg-white/5 transition-colors"
                          >
                            <span>{t("booking.viewAll") || "Xem tất cả"}</span>
                            <FiArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Empty bookings state */}
                    {recentBookings.length === 0 &&
                      !bookingsLoading &&
                      clientIsAuth &&
                      isCustomer && (
                        <div className="border-t border-white/10 px-4 py-3">
                          <p className="text-xs text-gray-400">
                            {t("booking.noBookings") || "Bạn chưa có tour nào"}
                          </p>
                          <Link
                            href="/tours"
                            onClick={() => setUserMenuOpen(false)}
                            className="text-xs text-[#fa8b02] hover:underline mt-1 block"
                          >
                            {t("booking.browseTours") || "Khám phá tour ngay"}
                          </Link>
                        </div>
                      )}

                    {/* Loading state */}
                    {bookingsLoading && (
                      <div className="border-t border-white/10 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-[#fa8b02] rounded-full animate-spin" />
                          {t("booking.loading") || "Đang tải..."}
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-2 border-t border-white/10">
                      {/* Profile */}
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <FiUser className="w-4 h-4" />
                        <span>
                          {t("common.profile") || "Thông tin cá nhân"}
                        </span>
                      </Link>

                      {/* Change Password */}
                      <Link
                        href="/profile?tab=password"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <FiLock className="w-4 h-4" />
                        <span>
                          {t("common.changePassword") || "Đổi mật khẩu"}
                        </span>
                      </Link>

                      {/* Settings */}
                      <Link
                        href="/profile?tab=settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <FiSettings className="w-4 h-4" />
                        <span>{t("common.settings") || "Cài đặt"}</span>
                      </Link>

                      {/* My Bookings */}
                      <Link
                        href="/bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <FiCalendar className="w-4 h-4" />
                        <span>{t("booking.myBookings") || "Tour đã đặt"}</span>
                      </Link>

                      {/* Custom Tour Requests */}
                      <Link
                        href="/tours/my-requests"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <FiClipboard className="w-4 h-4" />
                        <span>
                          {t("tourRequest.page.myRequests.title") ||
                            "Yêu cầu thiết kế tour"}
                        </span>
                      </Link>

                      <Button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>{t("common.signOut") || "Đăng xuất"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Buttons - When Not Logged In */}
              {!clientIsAuth && (
                <>
                  <Button
                    onClick={() => openAuth("login")}
                    text={mounted ? t("common.signIn") : "Sign In"}
                    className="px-5 py-2.5 font-semibold text-sm text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-200"
                  />
                  <Button
                    onClick={() => openAuth("signup")}
                    text={mounted ? t("common.signUp") : "Sign Up"}
                    className="px-6 py-2.5 bg-linear-to-r from-[#fa8b02] to-[#ff9f2d] text-white font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-[#fa8b02]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  />
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              ref={menuButtonRef}
              type="button"
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t("landing.a11y.openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
            >
              {mobileMenuOpen ? (
                <FiX suppressHydrationWarning className="w-6 h-6" />
              ) : (
                <FiMenu suppressHydrationWarning className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer removed (duplicate) */}

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenAuth={openAuth}
        dialogId="landing-mobile-menu"
        logoVariant="svg"
      />
      <AuthModal
        key={effectiveAuthView}
        open={effectiveAuthOpen}
        onClose={() => {
          setAuthOpen(false);
          setMobileMenuOpen(false);
        }}
        initialView={effectiveAuthView}
      />
      {isSolid && (
        <div
          className="h-[88px] md:h-[96px] w-full shrink-0"
          aria-hidden="true"
        />
      )}
    </>
  );
};
