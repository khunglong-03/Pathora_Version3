"use client";

import { useEffect } from "react";

/**
 * Disables DarkReader before React hydration to prevent flash of
 * incorrectly-styled content.  Runs as a Client Component so React
 * never sees a <script> tag among its children.
 */
export default function DisableDarkReader() {
  useEffect(() => {
    // Set attribute immediately on the client
    document.documentElement.setAttribute("data-darkreader-disable", "true");

    // Also try to disable via DarkReader API if available
    const dw = window as typeof window & { darkreader?: { disable: () => void } };
    if (dw.darkreader) {
      dw.darkreader.disable();
    }
  }, []);

  return null;
}
