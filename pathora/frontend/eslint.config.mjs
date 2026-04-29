// @ts-expect-error - Next.js ESLint config doesn't have TS types yet
import nextVitals from "eslint-config-next/core-web-vitals";
// @ts-expect-error - Next.js ESLint config doesn't have TS types yet
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Scratch / one-off scripts (CommonJS), not part of the Next.js app bundle
      ".tmp/**",
      "check_user.js",
      "fix_landing.js",
      "test_api.js",
    ],
  },
  // Project pragmatics: keep CI green without blocking on patterns that require
  // large refactors (gradual cleanup). Errors are still strict for rules not listed here.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Data-fetch-on-mount often triggers false positives vs. real cascade bugs
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Note: Hardcoded value detection is primarily done via code review.
  // The project uses centralized config in src/configs/apiGateway.ts
  // and process.env.NEXT_PUBLIC_* for environment variables.
];

export default eslintConfig;
