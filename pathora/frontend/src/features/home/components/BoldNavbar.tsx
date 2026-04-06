"use client";
import React from "react";
import { LandingHeader } from "@/features/shared/components";

/**
 * BoldNavbar — wraps LandingHeader with text logo variant for the home page.
 * Uses the same header design as all other user pages, ensuring visual consistency
 * across the entire user-facing experience.
 */
export const BoldNavbar = () => {
  return <LandingHeader variant="overlay" logoVariant="text" />;
};
