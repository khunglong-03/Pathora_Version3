import { useSelector, useDispatch } from "react-redux";
import { handleMenuHidden } from "@/store/layout";
import type { LayoutState } from "@/types/index";

const useMenuHidden = (): [boolean, (value: boolean) => void] => {
  const dispatch = useDispatch();
  const menuHidden = useSelector(
    (state: { layout: LayoutState }) => state.layout.menuHidden
  );

  const setMenuHidden = (value: boolean) => {
    dispatch(handleMenuHidden(value));
  };

  return [menuHidden, setMenuHidden];
};

export default useMenuHidden;
