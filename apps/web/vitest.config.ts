import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "#": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },

  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "text-summary"],
      include: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}", "env.ts", "proxy.ts"],
      exclude: [
        // Test and spec files
        "**/*.test.*",
        "**/*.spec.*",
        // Type declarations and type-only modules
        "**/*.d.ts",
        "**/*.type.ts",
        // Barrel re-exports — no logic to test
        "**/index.ts",
        // Type-only files
        "shared/lib/api/types.ts",
        "shared/lib/api/api-client/types.ts",
        "features/posts/components/post-images/types.ts",
        // Next.js app-router boilerplate — domain logic lives in features/*
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
        "app/**/not-found.tsx",
        // Headless UI primitives — style/composition only, no domain logic
        "shared/ui/button.tsx",
        "shared/ui/card.tsx",
        "shared/ui/logo.tsx",
        "shared/ui/form/**",
        // Layout shells — pure presentation, no domain logic
        "shared/layout/app-navigation.tsx",
        "shared/layout/auth-layout.tsx",
        "shared/layout/header.tsx",
        "shared/layout/main-layout.tsx",
        "shared/layout/navigation-link.tsx",
        "shared/layout/section-placeholder.tsx",
        // Post UI without testable logic
        "features/posts/components/loading-placeholder.tsx",
        "features/posts/components/post-images/constants.ts",
        "features/posts/components/post-images/sortable-post-image-item.tsx",
        // BFF client — Next.js server context only, not unit-testable in isolation
        "shared/lib/api/api-client/bff-client.ts",
      ],
      thresholds: {
        branches: 90,
        functions: 85,
        lines: 90,
        statements: 90,
      },
    },
  },
});
