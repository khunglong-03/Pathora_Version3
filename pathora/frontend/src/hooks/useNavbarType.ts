import { useSelector, useDispatch } from "react-redux";
import { handleNavBarType } from "@/store/layout";
import type { NavbarType, LayoutState } from "@/types/index";

const useNavbarType = (): [NavbarType, (val: NavbarType) => void] => {
  const dispatch = useDispatch();
  const navbarType = useSelector(
    (state: { layout: LayoutState }) => state.layout.navBarType
  );
  const setNavbarType = (val: NavbarType) => dispatch(handleNavBarType(val));
  return [navbarType, setNavbarType];
};

export default useNavbarType;
