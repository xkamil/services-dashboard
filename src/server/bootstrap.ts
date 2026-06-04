import bcrypt from "bcryptjs";

import { db } from "~/server/db";

/** Credentials for the auto-created first-run admin. */
const BOOTSTRAP_ADMIN_EMAIL = "admin";
const BOOTSTRAP_ADMIN_PASSWORD = "admin";

/**
 * On a fresh database (no users yet), create a default admin account so the app
 * is usable immediately. The email "admin" is intentionally not a valid email —
 * the login schema accepts it (registration still requires a real email).
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
      status: "ACTIVE",
      role: "SUPER_ADMIN",
    },
  });

  console.log(
    `[bootstrap] Created default admin user (email: "${BOOTSTRAP_ADMIN_EMAIL}", password: "${BOOTSTRAP_ADMIN_PASSWORD}")`,
  );
}
