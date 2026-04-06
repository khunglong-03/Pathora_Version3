import { useSelector, useDispatch } from "react-redux";
import { ContentWidth, LayoutState } from "../types";
import { handleContentWidth } from "../store/layout";

const useContentWidth = (): [ContentWidth, (val: ContentWidth) => void] => {
  const dispatch = useDispatch();
  const contentWidth = useSelector(
    (state: { layout: LayoutState }) => state.layout.contentWidth,
  );

  // ** Toggles Content Width
  const setContentWidth = (val: ContentWidth) =>
    dispatch(handleContentWidth(val));

  return [contentWidth, setContentWidth];
};

export default useContentWidth;
