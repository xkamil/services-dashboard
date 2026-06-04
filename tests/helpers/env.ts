import path from "node:path";

/**
 * Absolute path + URL for the SQLite database used by the test suite. Kept in
 * one place so the Vitest config, the global setup (which runs `prisma db push`)
 * and the test Prisma client all point at exactly the same file. An absolute
 * `file:` URL avoids SQLite's relative-path resolution differing between the
 * Prisma CLI (relative to schema.prisma) and the client (relative to cwd).
 */
export const TEST_DB_PATH = path.join(process.cwd(), "prisma", "test.sqlite");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;
