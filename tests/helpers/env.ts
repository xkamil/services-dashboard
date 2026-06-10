/**
 * Connection URL for the MongoDB database used by the test suite. Kept in one
 * place so the Vitest config, the global setup (which runs `prisma db push`) and
 * the test Prisma client all point at exactly the same database.
 *
 * Defaults to a local MongoDB; CI overrides it via `TEST_DATABASE_URL` to point
 * at its service container. The database must be a **replica set** — Prisma's
 * MongoDB connector wraps writes (even `deleteMany`) in transactions, which
 * require one. `directConnection=true` lets the driver talk to a single-node
 * replica set whose member is advertised under an unreachable container hostname.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "mongodb://localhost:27017/dashboard_test?directConnection=true";
