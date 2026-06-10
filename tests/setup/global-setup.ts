import { execSync } from "node:child_process";

import { TEST_DATABASE_URL } from "../helpers/env";

/**
 * Runs once before the whole suite: (re)creates the schema's indexes (unique
 * constraints, `@@index`) on the test MongoDB. We push the schema (rather than
 * running migrations — MongoDB has no migration engine) so the test DB always
 * matches `schema.prisma` exactly. This is non-destructive; per-test isolation
 * comes from `resetDb` (`beforeEach`), which empties every collection.
 */
export default function setup() {
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
