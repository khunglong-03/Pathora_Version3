import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { handleMobileMenu } from "@/store/layout";
import { usePathname } from "next/navigation";
import type { LayoutState } from "@/types/index";

const useMobileMenu = (): [boolean, (val: boolean) => void] => {
  const dispatch = useDispatch();
  const mobileMenu = useSelector(
    (state: { layout: LayoutState }) => state.layout.mobileMenu,
  );
  const pathname = usePathname();

  // ** Toggles Mobile Menu
  const setMobileMenu = useCallback(
    (val: boolean) => dispatch(handleMobileMenu(val)),
    [dispatch],
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenu(false);
  }, [pathname, setMobileMenu]);

  return [mobileMenu, setMobileMenu];
};

export default useMobileMenu;
