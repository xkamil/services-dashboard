import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createTestCaller } from "./helpers/caller";
import { createUser, sessionFor } from "./helpers/fixtures";
import { resetDb, testDb } from "./helpers/prisma";

beforeEach(resetDb);
afterAll(() => testDb.$disconnect());

describe("auth.register", () => {
  it("makes the first user a SUPER_ADMIN and activates them", async () => {
    const { caller } = createTestCaller();

    const result = await caller.auth.register({
      email: "first@test.local",
      password: "password123",
      role: "NON_TECHNICAL",
    });

    expect(result).toEqual({ isFirstUser: true });

    const user = await testDb.user.findUniqueOrThrow({
      where: { email: "first@test.local" },
    });
    expect(user.role).toBe("SUPER_ADMIN");
    expect(user.status).toBe("ACTIVE");
  });

  it("creates later users as PENDING with their requested role", async () => {
    await createUser({ email: "existing@test.local" });
    const { caller } = createTestCaller();

    const result = await caller.auth.register({
      email: "second@test.local",
      password: "password123",
      role: "DEV",
    });

    expect(result).toEqual({ isFirstUser: false });
    const user = await testDb.user.findUniqueOrThrow({
      where: { email: "second@test.local" },
    });
    expect(user.role).toBe("DEV");
    expect(user.status).toBe("PENDING_VERIFICATION");
  });

  it("rejects a duplicate email with CONFLICT", async () => {
    await createUser({ email: "taken@test.local" });
    const { caller } = createTestCaller();

    await expect(
      caller.auth.register({
        email: "taken@test.local",
        password: "password123",
        role: "DEV",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: "EMAIL_TAKEN" });
  });
});

describe("auth.login", () => {
  it("logs in an active user and persists the session", async () => {
    const user = await createUser({
      email: "login@test.local",
      password: "secret123",
      status: "ACTIVE",
    });
    const { caller, ironSession } = createTestCaller();

    const result = await caller.auth.login({
      email: "login@test.local",
      password: "secret123",
    });

    expect(result).toEqual({ requiresPasswordChange: false });
    expect(ironSession.userId).toBe(user.id);
    expect(ironSession.email).toBe(user.email);
    expect(ironSession.saveCount).toBe(1);
  });

  it("flags users that still have a temporary password", async () => {
    await createUser({
      email: "temp@test.local",
      password: "secret123",
      isTemporaryPassword: true,
    });
    const { caller } = createTestCaller();

    const result = await caller.auth.login({
      email: "temp@test.local",
      password: "secret123",
    });

    expect(result).toEqual({ requiresPasswordChange: true });
  });

  it("rejects a wrong password with UNAUTHORIZED", async () => {
    await createUser({ email: "wrong@test.local", password: "secret123" });
    const { caller } = createTestCaller();

    await expect(
      caller.auth.login({ email: "wrong@test.local", password: "nope" }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "INVALID_CREDENTIALS",
    });
  });

  it("rejects an unknown email with UNAUTHORIZED", async () => {
    const { caller } = createTestCaller();

    await expect(
      caller.auth.login({ email: "ghost@test.local", password: "secret123" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks BLOCKED accounts with FORBIDDEN", async () => {
    await createUser({
      email: "blocked@test.local",
      password: "secret123",
      status: "BLOCKED",
    });
    const { caller } = createTestCaller();

    await expect(
      caller.auth.login({ email: "blocked@test.local", password: "secret123" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "ACCOUNT_BLOCKED" });
  });

  it("blocks PENDING accounts with PRECONDITION_FAILED", async () => {
    await createUser({
      email: "pending@test.local",
      password: "secret123",
      status: "PENDING_VERIFICATION",
    });
    const { caller } = createTestCaller();

    await expect(
      caller.auth.login({ email: "pending@test.local", password: "secret123" }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "ACCOUNT_PENDING_VERIFICATION",
    });
  });
});

describe("auth.me", () => {
  it("returns the current session for an authenticated caller", async () => {
    const user = await createUser({ email: "me@test.local" });
    const { caller } = createTestCaller(sessionFor(user));

    await expect(caller.auth.me()).resolves.toMatchObject({
      userId: user.id,
      email: user.email,
    });
  });

  it("rejects anonymous callers with UNAUTHORIZED", async () => {
    const { caller } = createTestCaller();
    await expect(caller.auth.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("auth.changePassword", () => {
  it("updates the hash and clears the temporary-password flag", async () => {
    const user = await createUser({
      email: "change@test.local",
      password: "oldpass123",
      isTemporaryPassword: true,
    });
    const { caller, ironSession } = createTestCaller(sessionFor(user));

    await expect(
      caller.auth.changePassword({ newPassword: "newpass123" }),
    ).resolves.toEqual({ success: true });

    const updated = await testDb.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(updated.isTemporaryPassword).toBe(false);
    expect(await bcrypt.compare("newpass123", updated.passwordHash)).toBe(true);
    expect(ironSession.isTemporaryPassword).toBe(false);
  });
});

describe("auth.logout", () => {
  it("destroys the session", async () => {
    const user = await createUser({ email: "logout@test.local" });
    const { caller, ironSession } = createTestCaller(sessionFor(user));

    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
    expect(ironSession.destroyed).toBe(true);
  });

  it("requires authentication", async () => {
    const { caller } = createTestCaller();
    await expect(caller.auth.logout()).rejects.toBeInstanceOf(TRPCError);
  });
});
