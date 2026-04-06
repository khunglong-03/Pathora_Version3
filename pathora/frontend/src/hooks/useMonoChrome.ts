import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { handleMonoChrome } from "@/store/layout";
import type { LayoutState } from "@/types/index";

const useMonoChrome = (): [boolean, (val: boolean) => void] => {
  const dispatch = useDispatch();
  const isMonoChrome = useSelector(
    (state: { layout: LayoutState }) => state.layout.isMonochrome
  );

  const setMonoChrome = (val: boolean) => dispatch(handleMonoChrome(val));

  useEffect(() => {
    const element = document.getElementsByTagName("html")[0];

    if (isMonoChrome) {
      element.classList.add("grayscale");
    } else {
      element.classList.remove("grayscale");
    }
  }, [isMonoChrome]);

  return [isMonoChrome, setMonoChrome];
};

export default useMonoChrome;
