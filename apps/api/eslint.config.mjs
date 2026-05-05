import { nestJsConfig } from "@social/eslint-config/nest-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nestJsConfig,
  {
    ignores: ["eslint.config.mjs"],
  },
];
