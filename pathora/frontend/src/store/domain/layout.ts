export type SkinMode = "default" | "bordered";
export type ContentWidth = "full" | "boxed";
export type MenuLayoutType = "vertical" | "horizontal";
export type NavbarType = "sticky" | "static" | "floating" | "hidden";
export type FooterType = "sticky" | "static" | "hidden";

export interface MenuConfig {
  isCollapsed: boolean;
  isHidden: boolean;
}

export interface LayoutConfig {
  isRTL: boolean;
  skin: SkinMode;
  contentWidth: ContentWidth;
  type: MenuLayoutType;
  navBarType: NavbarType;
  footerType: FooterType;
  isMonochrome: boolean;
  menu: MenuConfig;
  mobileMenu: boolean;
  customizer: boolean;
}

export interface LayoutState {
  isRTL: boolean;
  isCollapsed: boolean;
  customizer: boolean;
  skin: SkinMode;
  contentWidth: ContentWidth;
  type: MenuLayoutType;
  menuHidden: boolean;
  navBarType: NavbarType;
  footerType: FooterType;
  mobileMenu: boolean;
  isMonochrome: boolean;
}
