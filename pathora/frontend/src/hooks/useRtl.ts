import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { handleRtl } from "@/store/layout";
import type { LayoutState } from "@/types/index";

const useRtl = (): [boolean, (val: boolean) => void] => {
  const dispatch = useDispatch();
  const isRtl = useSelector((state: { layout: LayoutState }) => state.layout.isRTL);

  const setRtl = (val: boolean) => dispatch(handleRtl(val));

  useEffect(() => {
    const element = document.getElementsByTagName("html")[0];

    if (isRtl) {
      element.setAttribute("dir", "rtl");
    } else {
      element.setAttribute("dir", "ltr");
    }
  }, [isRtl]);

  return [isRtl, setRtl];
};

export default useRtl;
