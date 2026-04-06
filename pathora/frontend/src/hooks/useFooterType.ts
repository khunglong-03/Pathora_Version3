import { useSelector, useDispatch } from "react-redux";
import { handleFooterType } from "@/store/layout";
import type { FooterType, LayoutState } from "@/types/index";

const useFooterType = (): [FooterType, (val: FooterType) => void] => {
  const dispatch = useDispatch();
  const footerType = useSelector(
    (state: { layout: LayoutState }) => state.layout.footerType
  );
  const setFooterType = (val: FooterType) => dispatch(handleFooterType(val));
  return [footerType, setFooterType];
};

export default useFooterType;
