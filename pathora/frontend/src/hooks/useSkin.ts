import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { handleSkin } from "@/store/layout";
import type { SkinMode, LayoutState } from "@/types/index";

const useSkin = (): [SkinMode, (mode: SkinMode) => void] => {
  const dispatch = useDispatch();
  const skin = useSelector((state: { layout: LayoutState }) => state.layout.skin);

  const setSkin = (mode: SkinMode) => dispatch(handleSkin(mode));

  useEffect(() => {
    const body = window.document.body;
    const classNames = {
      default: "skin--default",
      bordered: "skin--bordered",
    };

    if (skin === "default") {
      body.classList.add(classNames.default);
      body.classList.remove(classNames.bordered);
    } else if (skin === "bordered") {
      body.classList.add(classNames.bordered);
      body.classList.remove(classNames.default);
    }
  }, [skin]);

  return [skin, setSkin];
};

export default useSkin;
