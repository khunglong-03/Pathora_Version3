import { useSelector, useDispatch } from "react-redux";
import { handleSidebarCollapsed } from "@/store/layout";
import type { LayoutState } from "@/types/index";

const useSidebar = (): [boolean, (val: boolean) => void] => {
  const dispatch = useDispatch();
  const collapsed = useSelector(
    (state: { layout: LayoutState }) => state.layout.isCollapsed
  );

  // ** Toggles Menu Collapsed
  const setMenuCollapsed = (val: boolean) => dispatch(handleSidebarCollapsed(val));

  return [collapsed, setMenuCollapsed];
};

export default useSidebar;
