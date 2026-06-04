import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

import { TEST_DATABASE_URL, TEST_DB_PATH } from "../helpers/env";

/**
 * Runs once before the whole suite: creates a fresh SQLite database with the
 * current Prisma schema. We push the schema (rather than running migrations) so
 * the test DB always matches `schema.prisma` exactly, no migration history
 * needed.
 */
export default function setup() {
  for (const suffix of ["", "-journal"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (existsSync(file)) rmSync(file);
  }

  // No `--force-reset`: we already removed the file above, so this just creates
  // the schema on a fresh database (and avoids Prisma's destructive-action guard).
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
