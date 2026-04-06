export type SkinMode = "default" | "bordered";
export type ContentWidth = "full" | "boxed";
export type LayoutType = "vertical" | "horizontal";
export type NavBarType = "sticky" | "static" | "hidden";
export type FooterType = "sticky" | "static" | "hidden";

export interface MenuConfig {
  isCollapsed: boolean;
  isHidden: boolean;
}

export interface LayoutConfig {
  isRTL: boolean;
  skin: SkinMode;
  contentWidth: ContentWidth;
  type: LayoutType;
  navBarType: NavBarType;
  footerType: FooterType;
  isMonochrome: boolean;
  menu: MenuConfig;
  mobileMenu: boolean;
  customizer: boolean;
}

export interface AppConfig {
  name: string;
}

export interface ThemeConfig {
  app: AppConfig;
  layout: LayoutConfig;
}

const themeConfig: ThemeConfig = {
  app: {
    name: "progcoder React",
  },
  // layout
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
};

export default themeConfig;
