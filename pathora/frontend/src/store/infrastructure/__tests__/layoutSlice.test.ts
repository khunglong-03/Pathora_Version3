import { describe, expect, it, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

// Mock themeConfig before importing layoutSlice (which depends on it)
vi.mock("@/configs/themeConfig", () => ({
  default: {
    layout: {
      isRTL: false,
      skin: "default",
      contentWidth: "full",
      type: "vertical",
      navBarType: "sticky",
      footerType: "static",
      isMonochrome: false,
      menu: {
        isCollapsed: false,
        isHidden: false,
      },
      mobileMenu: false,
      customizer: false,
    },
  },
}));

// Mock localStorage for SSR safety (layoutSlice reducers access window.localStorage)
vi.stubGlobal("window", {
  localStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

import layoutReducer, {
  handleSidebarCollapsed,
  handleCustomizer,
  handleRtl,
  handleSkin,
  handleContentWidth,
  handleType,
  handleMenuHidden,
  handleNavBarType,
  handleFooterType,
  handleMobileMenu,
  handleMonoChrome,
} from "../layoutSlice";
import type { SkinMode, ContentWidth, MenuLayoutType, NavbarType, FooterType } from "../../domain/layout";

// Helper to build a store with layout slice
const createLayoutStore = (preloadedState?: { layout: ReturnType<typeof layoutReducer> }) => {
  return configureStore({
    reducer: { layout: layoutReducer },
    preloadedState,
  });
};

// Default initial state values from the slice (without localStorage)
const getDefaultState = () => ({
  isRTL: false,
  isCollapsed: false,
  customizer: false,
  skin: "default" as SkinMode,
  contentWidth: "full" as ContentWidth,
  type: "vertical" as MenuLayoutType,
  menuHidden: false,
  navBarType: "sticky" as NavbarType,
  footerType: "sticky" as FooterType,
  mobileMenu: false,
  isMonochrome: false,
});

describe("layoutSlice", () => {
  describe("handleSidebarCollapsed", () => {
    it("sets isCollapsed to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleSidebarCollapsed(true));

      expect(store.getState().layout.isCollapsed).toBe(true);
    });

    it("sets isCollapsed to false", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), isCollapsed: true },
      });

      store.dispatch(handleSidebarCollapsed(false));

      expect(store.getState().layout.isCollapsed).toBe(false);
    });

    it("toggles sidebar state", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleSidebarCollapsed(true));
      expect(store.getState().layout.isCollapsed).toBe(true);

      store.dispatch(handleSidebarCollapsed(false));
      expect(store.getState().layout.isCollapsed).toBe(false);
    });
  });

  describe("handleCustomizer", () => {
    it("sets customizer to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleCustomizer(true));

      expect(store.getState().layout.customizer).toBe(true);
    });

    it("toggles customizer off", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), customizer: true },
      });

      store.dispatch(handleCustomizer(false));

      expect(store.getState().layout.customizer).toBe(false);
    });
  });

  describe("handleRtl", () => {
    it("sets isRTL to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleRtl(true));

      expect(store.getState().layout.isRTL).toBe(true);
    });

    it("sets isRTL to false", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), isRTL: true },
      });

      store.dispatch(handleRtl(false));

      expect(store.getState().layout.isRTL).toBe(false);
    });
  });

  describe("handleSkin", () => {
    it("sets skin to 'dark'", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleSkin("bordered"));

      expect(store.getState().layout.skin).toBe("bordered");
    });

    it("sets skin to 'default'", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), skin: "bordered" as SkinMode },
      });

      store.dispatch(handleSkin("default"));

      expect(store.getState().layout.skin).toBe("default");
    });
  });

  describe("handleContentWidth", () => {
    it("sets contentWidth to 'boxed'", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleContentWidth("boxed"));

      expect(store.getState().layout.contentWidth).toBe("boxed");
    });

    it("sets contentWidth to 'full'", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), contentWidth: "boxed" as ContentWidth },
      });

      store.dispatch(handleContentWidth("full"));

      expect(store.getState().layout.contentWidth).toBe("full");
    });
  });

  describe("handleType", () => {
    it("sets type to 'horizontal'", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleType("horizontal"));

      expect(store.getState().layout.type).toBe("horizontal");
    });

    it("sets type to 'vertical'", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), type: "horizontal" as MenuLayoutType },
      });

      store.dispatch(handleType("vertical"));

      expect(store.getState().layout.type).toBe("vertical");
    });
  });

  describe("handleMenuHidden", () => {
    it("sets menuHidden to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleMenuHidden(true));

      expect(store.getState().layout.menuHidden).toBe(true);
    });
  });

  describe("handleNavBarType", () => {
    it("sets navBarType to 'floating'", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleNavBarType("floating"));

      expect(store.getState().layout.navBarType).toBe("floating");
    });
  });

  describe("handleFooterType", () => {
    it("sets footerType to 'hidden'", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleFooterType("hidden"));

      expect(store.getState().layout.footerType).toBe("hidden");
    });
  });

  describe("handleMobileMenu", () => {
    it("sets mobileMenu to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleMobileMenu(true));

      expect(store.getState().layout.mobileMenu).toBe(true);
    });

    it("sets mobileMenu to false", () => {
      const store = createLayoutStore({
        layout: { ...getDefaultState(), mobileMenu: true },
      });

      store.dispatch(handleMobileMenu(false));

      expect(store.getState().layout.mobileMenu).toBe(false);
    });
  });

  describe("handleMonoChrome", () => {
    it("sets isMonochrome to true", () => {
      const store = createLayoutStore({ layout: getDefaultState() });

      store.dispatch(handleMonoChrome(true));

      expect(store.getState().layout.isMonochrome).toBe(true);
    });
  });
});
