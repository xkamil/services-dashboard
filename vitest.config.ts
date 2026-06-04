import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./tests/helpers/env";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    // All test files share one SQLite file and reset it between tests, so they
    // must not run in parallel against the same database.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      // iron-session requires a >=32 char secret; value is irrelevant in tests.
      SESSION_SECRET: "test-session-secret-at-least-32-characters",
    },
  },
});
