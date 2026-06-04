import bcrypt from "bcryptjs";

import type { Role } from "~/lib/roles";
import type { SessionData } from "~/server/auth";
import { testDb } from "./prisma";

type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING_VERIFICATION";

interface CreateUserOptions {
  email?: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  isTemporaryPassword?: boolean;
}

let userSeq = 0;

/** Inserts a user with a bcrypt-hashed password and sensible defaults. */
export async function createUser(options: CreateUserOptions = {}) {
  const password = options.password ?? "password123";
  return testDb.user.create({
    data: {
      email: options.email ?? `user-${++userSeq}@test.local`,
      passwordHash: await bcrypt.hash(password, 10),
      role: options.role ?? "NON_TECHNICAL",
      status: options.status ?? "ACTIVE",
      isTemporaryPassword: options.isTemporaryPassword ?? false,
    },
  });
}

/** Builds the session payload that the tRPC context derives from a logged-in user. */
export function sessionFor(user: {
  id: string;
  email: string;
  role: string;
  isTemporaryPassword: boolean;
}): SessionData {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    isTemporaryPassword: user.isTemporaryPassword,
  };
}
