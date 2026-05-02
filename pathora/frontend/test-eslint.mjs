// @ts-expect-error
import nextVitals from "eslint-config-next/core-web-vitals";
// @ts-expect-error
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".tmp/**",
      "check_user.js",
      "fix_landing.js",
      "test_api.js",
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
export default eslintConfig;
