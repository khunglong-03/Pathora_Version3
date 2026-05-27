import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock Framer Motion globally
vi.mock("framer-motion", () => ({
  motion: {
    div: "div",
    button: "button",
    span: "span",
    section: "section",
    article: "article",
    header: "header",
    nav: "nav",
    aside: "aside",
    main: "main",
    footer: "footer",
    ul: "ul",
    li: "li",
    p: "p",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    a: "a",
    img: "img",
    form: "form",
    input: "input",
    select: "select",
    textarea: "textarea",
    table: "table",
    thead: "thead",
    tbody: "tbody",
    tr: "tr",
    th: "th",
    td: "td",
    label: "label",
    svg: "svg",
    path: "path",
    circle: "circle",
    rect: "rect",
    line: "line",
    polygon: "polygon",
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
  }),
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
  motionWrapper: "div",
}));

// Mock Phosphor icons
vi.mock("@phosphor-icons/react", () => {
  const IconMock = (name: string) => {
    const Component = (props: { size?: number; weight?: string; "aria-label"?: string; [key: string]: unknown }) => (
      <span data-testid={`mock-icon-${name}`} aria-label={props["aria-label"]}>{name}</span>
    );
    Component.displayName = `IconMock(${name})`;
    return Component;
  };
  return {
    ArrowLeft: IconMock("ArrowLeft"),
    ArrowsClockwise: IconMock("ArrowsClockwise"),
    Warning: IconMock("Warning"),
    Clock: IconMock("Clock"),
    Van: IconMock("Van"),
    Bed: IconMock("Bed"),
    Phone: IconMock("Phone"),
    EnvelopeSimple: IconMock("EnvelopeSimple"),
    DotsThreeVertical: IconMock("DotsThreeVertical"),
    Eye: IconMock("Eye"),
    UsersThree: IconMock("UsersThree"),
    PencilSimple: IconMock("PencilSimple"),
    ArrowRight: IconMock("ArrowRight"),
    X: IconMock("X"),
    UserPlus: IconMock("UserPlus"),
    User: IconMock("User"),
    ArrowClockwise: IconMock("ArrowClockwise"),
    Check: IconMock("Check"),
    CheckCircle: IconMock("CheckCircle"),
    XCircle: IconMock("XCircle"),
    AirplaneTilt: IconMock("AirplaneTilt"),
    IdentificationCard: IconMock("IdentificationCard"),
    WarningCircle: IconMock("WarningCircle"),
    HandHeart: IconMock("HandHeart"),
    Receipt: IconMock("Receipt"),
    Info: IconMock("Info"),
    MapTrifold: IconMock("MapTrifold"),
    Tag: IconMock("Tag"),
    MapPin: IconMock("MapPin"),
    Users: IconMock("Users"),
    Calendar: IconMock("Calendar"),
    CaretDown: IconMock("CaretDown"),
    CaretUp: IconMock("CaretUp"),
    CarProfile: IconMock("CarProfile"),
    Train: IconMock("Train"),
    Boat: IconMock("Boat"),
    DownloadSimple: IconMock("DownloadSimple"),
    Spinner: IconMock("Spinner"),
    UserCirclePlus: IconMock("UserCirclePlus"),
    Trash: IconMock("Trash"),
  };
});

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Mock @/components/ui/Icon
vi.mock("@/components/ui/Icon", () => ({
  default: ({ icon }: { icon: string }) => <span data-testid={`mock-icon-${icon}`}>{icon}</span>,
  __esModule: true,
}));

// Mock @/components/ui/Pagination
vi.mock("@/components/ui/Pagination", () => ({
  default: () => <div data-testid="mock-pagination">Pagination</div>,
}));

// Mock @/components/ui/SkeletonTable
vi.mock("@/components/ui/SkeletonTable", () => ({
  SkeletonTable: () => <div data-testid="mock-skeleton-table">Loading...</div>,
}));

// Mock IntersectionObserver for next/link compatibility
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    root = null;
    rootMargin = "";
    thresholds = [];
    takeRecords = () => [];
  },
});
