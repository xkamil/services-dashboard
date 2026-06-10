import { PrismaClient } from "../../generated/prisma";
import { TEST_DATABASE_URL } from "./env";

/**
 * A Prisma client pointed at the dedicated test database. This is the client
 * injected into the tRPC context (`ctx.db`) for every test, so the routers run
 * their real queries against a real (but disposable) SQLite database.
 */
export const testDb = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });

/** Wipes all rows so each test starts from a known-empty database. */
export async function resetDb(): Promise<void> {
  // MongoDB has no DB-level cascade (it's Prisma-emulated), so clear UserSecret
  // explicitly rather than relying on the User relation to take it down.
  await testDb.auditLog.deleteMany();
  await testDb.configVersion.deleteMany();
  await testDb.userSecret.deleteMany();
  await testDb.user.deleteMany();
}
