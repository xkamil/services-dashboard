import { readFile } from "node:fs/promises";
import path from "node:path";

import bcrypt from "bcryptjs";

import { appConfigSchema } from "~/lib/config/schema";
import { db } from "~/server/db";

/** Credentials for the auto-created first-run admin. */
const BOOTSTRAP_ADMIN_EMAIL = "admin";
const BOOTSTRAP_ADMIN_PASSWORD = "admin";

/** Shared default password for the seeded example users. */
const BOOTSTRAP_USER_PASSWORD = "password";

/** The example users seeded alongside the first-run admin. */
const BOOTSTRAP_USERS = [
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `user${i + 1}@example.com`,
    role: "USER" as const,
  })),
  { email: "admin@example.com", role: "ADMIN" as const },
];

/**
 * On a fresh database (no users yet), create a default admin account so the app
 * is usable immediately, plus a set of example users for testing. The email
 * "admin" is intentionally not a valid email — the login schema accepts it
 * (registration still requires a real email).
 *
 * Idempotent: does nothing once any user exists.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  const userCount = await db.user.count();
  if (userCount > 0) return;

  const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);

  await db.user.create({
    data: {
      email: BOOTSTRAP_ADMIN_EMAIL,
      passwordHash,
      isTemporaryPassword: false,
      role: "SUPER_ADMIN",
    },
  });

  console.log(
    `[bootstrap] Created default admin user (email: "${BOOTSTRAP_ADMIN_EMAIL}", password: "${BOOTSTRAP_ADMIN_PASSWORD}")`,
  );

  const userPasswordHash = await bcrypt.hash(BOOTSTRAP_USER_PASSWORD, 12);

  await db.user.createMany({
    data: BOOTSTRAP_USERS.map(({ email, role }) => ({
      email,
      passwordHash: userPasswordHash,
      isTemporaryPassword: false,
      role,
    })),
  });

  console.log(
    `[bootstrap] Created ${BOOTSTRAP_USERS.length} example users (password: "${BOOTSTRAP_USER_PASSWORD}")`,
  );
}

/** Path to the initial configuration committed to the repo. */
const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "config",
  "default-config.json",
);

/**
 * On a fresh database (no config versions yet), seed version 1 from the config
 * committed to the repo so the app never starts with an empty configuration.
 *
 * Idempotent: does nothing once any version exists. Throws if the committed
 * file is missing or fails validation — a broken seed should fail loudly.
 */
export async function ensureBootstrapConfig(): Promise<void> {
  const versionCount = await db.configVersion.count();
  if (versionCount > 0) return;

  const raw = await readFile(DEFAULT_CONFIG_PATH, "utf8");
  const data = appConfigSchema.parse(JSON.parse(raw));

  await db.configVersion.create({
    data: {
      version: 1,
      data: JSON.stringify(data),
      message: "Initial configuration",
      authorEmail: "system",
    },
  });

  console.log("[bootstrap] Seeded initial configuration (version 1)");
}
