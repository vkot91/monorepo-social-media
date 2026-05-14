import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          // Points to each app/package tsconfig from the monorepo root.
          // The glob picks up every tsconfig that has path aliases defined.
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
      },
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "no-console": "warn",
      // Auto-sorts and groups imports. Works great with --fix.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 1. Side-effect imports (e.g. import './styles.css')
            ["^\\u0000"],
            // 2. Node built-ins (node:path, node:fs, etc.)
            ["^node:"],
            // 3. External packages
            ["^@?\\w"],
            // 4. Internal aliases (e.g. @/components, ~/utils)
            ["^#/", "^~/"],
            // 5. Relative imports — parent dirs first, then siblings
            ["^\\.\\./", "^\\./"],
            // 6. Style/asset imports last
            ["^.+\\.(css|scss|sass|less|svg|png|jpg|gif|webp)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // ─── Unused imports ───────────────────────────────────────────────────
      // Catches and auto-removes unused imports (more import-aware than no-unused-vars)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Disable the base rule — unused-imports handles it
      "no-unused-vars": "off",

      // ─── Correctness ──────────────────────────────────────────────────────
      // Prevents importing packages not in package.json (catches pnpm phantom deps)
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.{js,ts,jsx,tsx}",
            "**/*.spec.{js,ts,jsx,tsx}",
            "**/*.setup.{js,ts,jsx,tsx}",
            "**/src/test/**",
            "**/test/**",
            "**/*.config.{js,ts,mjs,cjs}",
            "**/vite.config.*",
            "**/vitest.config.*",
            "**/vitest.setup.*",
            "**/jest.config.*",
            "**/playwright.config.*",
          ],
        },
      ],
      // Prevents circular dependency chains
      "import/no-cycle": ["warn", { maxDepth: 4 }],
      // Prevents a file from importing itself
      "import/no-self-import": "error",
      // Prevents duplicate imports from the same module
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      // Ensures imports resolve to real files/modules
      "import/no-unresolved": [
        "error",
        {
          // '#' is a valid path alias prefix — resolver handles it
          ignore: ["^#/"],
        },
      ],

      // ─── Style ────────────────────────────────────────────────────────────
      // All imports must be at the top of the file
      "import/first": "error",
      // Blank line required between imports and the rest of the code
      "import/newline-after-import": ["error", { count: 1 }],
      // Disallow namespace imports (import * as foo) — prefer named imports
      "import/no-namespace": "warn",
    },
  },

  {
    ignores: ["dist/**", "coverage/**", ".next/**", "src/generated/**"],
  },
];
