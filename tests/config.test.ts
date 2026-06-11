import { readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { z } from "zod";

import { appConfigSchema, type AppConfig } from "~/lib/config/schema";
import { createTestCaller } from "./helpers/caller";
import { createUser, sessionFor } from "./helpers/fixtures";
import { resetDb, testDb } from "./helpers/prisma";

beforeEach(resetDb);
afterAll(() => testDb.$disconnect());

type ConfigInput = z.input<typeof appConfigSchema>;

function makeConfig(overrides?: Partial<ConfigInput>): AppConfig {
  return appConfigSchema.parse({
    schemaVersion: 1,
    defaults: {
      environment: { variables: {}, links: {} },
      service: { links: {} },
    },
    environments: [
      { name: "Development", type: "TEST", variables: {}, links: {}, services: [] },
    ],
    services: [{ name: "Auth" }],
    ...overrides,
  });
}

async function adminCaller() {
  const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
  return { admin, ...createTestCaller(sessionFor(admin)) };
}

describe("admin.config.save", () => {
  it("creates version 1 with the caller as author", async () => {
    const { admin, caller } = await adminCaller();

    const result = await caller.admin.config.save({
      data: makeConfig(),
      message: "first",
    });

    expect(result.version).toBe(1);
    expect(result.authorEmail).toBe(admin.email);

    const stored = await testDb.configVersion.findUniqueOrThrow({
      where: { version: 1 },
    });
    expect(stored.authorId).toBe(admin.id);
  });

  it("increments the version on each save", async () => {
    const { caller } = await adminCaller();
    await caller.admin.config.save({ data: makeConfig() });
    const second = await caller.admin.config.save({ data: makeConfig() });
    expect(second.version).toBe(2);
  });

  it("rejects non-admin callers with FORBIDDEN", async () => {
    const user = await createUser({ email: "user@test.local", role: "USER" });
    const { caller } = createTestCaller(sessionFor(user));
    await expect(
      caller.admin.config.save({ data: makeConfig() }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects anonymous callers with UNAUTHORIZED", async () => {
    const { caller } = createTestCaller();
    await expect(
      caller.admin.config.save({ data: makeConfig() }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a config referencing an unknown service", async () => {
    const { caller } = await adminCaller();
    const bad = {
      schemaVersion: 1,
      defaults: {
        environment: { variables: {}, links: {} },
        service: { links: {} },
      },
      environments: [
        {
          name: "Dev",
          variables: {},
          links: {},
          services: [{ name: "ghost" }],
        },
      ],
      services: [],
    };
    await expect(
      caller.admin.config.save({ data: bad as never }),
    ).rejects.toBeTruthy();
  });

  it("records the save in the audit log", async () => {
    const { admin, caller } = await adminCaller();
    await caller.admin.config.save({ data: makeConfig() });

    const logs = await testDb.auditLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "admin.config.save",
      userEmail: admin.email,
    });
  });
});

describe("admin.config.revert", () => {
  it("restores an earlier version as a new version", async () => {
    const { caller } = await adminCaller();

    const v1 = makeConfig({
      services: [{ name: "Auth" }],
    });
    const v2 = makeConfig({
      services: [{ name: "Auth" }, { name: "Payroll" }],
    });
    await caller.admin.config.save({ data: v1 });
    await caller.admin.config.save({ data: v2 });

    const reverted = await caller.admin.config.revert({ version: 1 });
    expect(reverted.version).toBe(3);
    expect(reverted.message).toBe("Reverted to v1");

    const current = await caller.admin.config.getCurrent();
    expect(current?.data.services.map((s) => s.name)).toEqual(["Auth"]);
  });
});

describe("admin.config.history / getVersion / diff", () => {
  it("lists versions newest first and reads a single version", async () => {
    const { caller } = await adminCaller();
    await caller.admin.config.save({ data: makeConfig(), message: "v1" });
    await caller.admin.config.save({ data: makeConfig(), message: "v2" });

    const history = await caller.admin.config.history();
    expect(history.map((h) => h.version)).toEqual([2, 1]);

    const v1 = await caller.admin.config.getVersion({ version: 1 });
    expect(v1.message).toBe("v1");
  });

  it("diffs two versions", async () => {
    const { caller } = await adminCaller();
    await caller.admin.config.save({
      data: makeConfig({
        services: [{ name: "Auth", links: { repository: "https://a" } }],
      }),
    });
    await caller.admin.config.save({
      data: makeConfig({
        services: [{ name: "Auth", links: { repository: "https://b" } }],
      }),
    });

    const changes = await caller.admin.config.diff({ from: 1, to: 2 });
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.type === "CHANGE")).toBe(true);
  });
});

describe("seed config", () => {
  it("the committed default config satisfies the schema", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "config", "default-config.json"),
      "utf8",
    );
    expect(() => appConfigSchema.parse(JSON.parse(raw))).not.toThrow();
  });
});
