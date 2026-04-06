import { useSyncExternalStore } from "react";

interface Breakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

interface UseWidthReturn {
  width: number;
  breakpoints: Breakpoints;
}

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getWidth() {
  return window.innerWidth;
}

function getServerWidth() {
  return 0;
}

export default function useWidth(): UseWidthReturn {
  const width = useSyncExternalStore(subscribeToResize, getWidth, getServerWidth);

  const breakpoints: Breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };

  return { width, breakpoints };
}
