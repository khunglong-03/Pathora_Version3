import { useSelector, useDispatch } from "react-redux";
import { handleType } from "@/store/layout";
import type { MenuLayoutType, LayoutState } from "@/types/index";

const useMenuLayout = (): [MenuLayoutType, (value: MenuLayoutType) => void] => {
  const dispatch = useDispatch();
  const menuType = useSelector((state: { layout: LayoutState }) => state.layout.type);

  const setMenuLayout = (value: MenuLayoutType) => {
    dispatch(handleType(value));
  };

  return [menuType, setMenuLayout];
};

export default useMenuLayout;
