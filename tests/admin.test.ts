import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createTestCaller } from "./helpers/caller";
import { createUser, sessionFor } from "./helpers/fixtures";
import { resetDb, testDb } from "./helpers/prisma";

beforeEach(resetDb);
afterAll(() => testDb.$disconnect());

describe("admin.users.list", () => {
  it("returns all users for an ADMIN, newest first", async () => {
    const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
    await createUser({ email: "a@test.local" });
    await createUser({ email: "b@test.local" });
    const { caller } = createTestCaller(sessionFor(admin));

    const users = await caller.admin.users.list();

    expect(users).toHaveLength(3);
    // Ordered by createdAt desc — the most recently created user comes first.
    expect(users[0]?.email).toBe("b@test.local");
    // The select must not leak password hashes.
    expect(users[0]).not.toHaveProperty("passwordHash");
  });

  it("rejects plain USER callers with FORBIDDEN", async () => {
    const user = await createUser({ email: "user@test.local", role: "USER" });
    const { caller } = createTestCaller(sessionFor(user));

    await expect(caller.admin.users.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects anonymous callers with UNAUTHORIZED", async () => {
    const { caller } = createTestCaller();
    await expect(caller.admin.users.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("admin.users.updateRole (SUPER_ADMIN only)", () => {
  it("lets a SUPER_ADMIN change a user's role", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const target = await createUser({ email: "target@test.local" });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    await caller.admin.users.updateRole({ userId: target.id, role: "ADMIN" });

    const updated = await testDb.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(updated.role).toBe("ADMIN");
  });

  it("forbids a plain ADMIN from changing roles", async () => {
    const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
    const target = await createUser({ email: "target@test.local" });
    const { caller } = createTestCaller(sessionFor(admin));

    await expect(
      caller.admin.users.updateRole({ userId: target.id, role: "ADMIN" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("admin.users.delete", () => {
  it("deletes another user", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const target = await createUser({ email: "target@test.local" });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    await expect(
      caller.admin.users.delete({ userId: target.id }),
    ).resolves.toEqual({ success: true });

    expect(
      await testDb.user.findUnique({ where: { id: target.id } }),
    ).toBeNull();
  });

  it("refuses to let a user delete themselves", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    await expect(
      caller.admin.users.delete({ userId: superAdmin.id }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "CANNOT_DELETE_SELF",
    });
    expect(
      await testDb.user.findUnique({ where: { id: superAdmin.id } }),
    ).not.toBeNull();
  });
});

describe("admin.users.resetPassword", () => {
  it("issues a temporary password and stores its hash", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const target = await createUser({
      email: "target@test.local",
      isTemporaryPassword: false,
    });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    const { password } = await caller.admin.users.resetPassword({
      userId: target.id,
    });

    expect(password).toHaveLength(16);
    const updated = await testDb.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(updated.isTemporaryPassword).toBe(true);
    expect(await bcrypt.compare(password, updated.passwordHash)).toBe(true);
  });
});

describe("audit logging", () => {
  it("records successful admin mutations with a redacted input", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const target = await createUser({ email: "target@test.local" });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    await caller.admin.users.resetPassword({ userId: target.id });

    const logs = await testDb.auditLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "admin.users.resetPassword",
      userId: superAdmin.id,
      userEmail: superAdmin.email,
    });
    // The mutation input is persisted (no secrets in this particular input).
    expect(JSON.parse(logs[0]!.input!)).toEqual({ userId: target.id });
  });

  it("does not record failed mutations", async () => {
    const superAdmin = await createUser({
      email: "super@test.local",
      role: "SUPER_ADMIN",
    });
    const { caller } = createTestCaller(sessionFor(superAdmin));

    await expect(
      caller.admin.users.delete({ userId: superAdmin.id }),
    ).rejects.toThrow();

    expect(await testDb.auditLog.count()).toBe(0);
  });
});

describe("admin.audit.list", () => {
  it("returns audit entries within the requested range", async () => {
    const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
    await testDb.auditLog.create({
      data: { action: "admin.users.delete", createdAt: new Date("2026-01-15") },
    });
    await testDb.auditLog.create({
      data: { action: "admin.users.updateRole", createdAt: new Date("2026-03-01") },
    });
    const { caller } = createTestCaller(sessionFor(admin));

    const inRange = await caller.admin.audit.list({
      from: new Date("2026-01-01"),
      to: new Date("2026-01-31"),
    });

    expect(inRange).toHaveLength(1);
    expect(inRange[0]?.action).toBe("admin.users.delete");
  });
});
