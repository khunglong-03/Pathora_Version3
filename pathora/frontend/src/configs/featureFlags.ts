export const featureFlags = {
  /**
   * Public tour instance namespace:
   * /tour-operator/tour-instances/public/[id]/...
   *
   * Enabled by default. Set NEXT_PUBLIC_ENABLE_PUBLIC_TOUR_SUB_ROUTES=false
   * to roll traffic back to the generic tour-instance detail route.
   */
  enablePublicTourSubRoutes:
    process.env.NEXT_PUBLIC_ENABLE_PUBLIC_TOUR_SUB_ROUTES !== "false",

  /**
   * Tour Guide passenger manifest view.
   * Enabled by default. Set NEXT_PUBLIC_ENABLE_GUIDE_MANIFEST=false to disable.
   */
  enableGuideManifest:
    process.env.NEXT_PUBLIC_ENABLE_GUIDE_MANIFEST !== "false",
} as const;
