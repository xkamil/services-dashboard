import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { SECRET_KEYS } from "~/lib/secrets";
import { decryptSecret, encryptSecret } from "~/server/secrets/crypto";
import { getUserSecret, requireUserSecret } from "~/server/secrets";

import { createTestCaller } from "./helpers/caller";
import { createUser, sessionFor } from "./helpers/fixtures";
import { resetDb, testDb } from "./helpers/prisma";

beforeEach(resetDb);
afterAll(() => testDb.$disconnect());

describe("secrets crypto", () => {
  it("round-trips a value and never stores it in the clear", () => {
    const plaintext = "ghp_super_secret_token_value";
    const payload = encryptSecret(plaintext);

    expect(payload).not.toContain(plaintext);
    expect(payload.split(".")).toHaveLength(3); // iv.tag.ciphertext
    expect(decryptSecret(payload)).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("throws when the ciphertext has been tampered with", () => {
    const payload = encryptSecret("value");
    const [iv, tag, data] = payload.split(".");
    const tampered = [iv, tag, Buffer.from("evil").toString("base64")].join(".");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("secrets.list", () => {
  it("returns every supported key as not-set for a new user", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));

    const list = await caller.secrets.list();

    expect(list.map((s) => s.key).sort()).toEqual([...SECRET_KEYS].sort());
    expect(list.every((s) => s.isSet === false)).toBe(true);
    expect(list.every((s) => s.updatedAt === null)).toBe(true);
    // The list must never carry the value or ciphertext.
    for (const entry of list) {
      expect(entry).not.toHaveProperty("value");
      expect(entry).not.toHaveProperty("ciphertext");
    }
  });

  it("rejects anonymous callers with UNAUTHORIZED", async () => {
    const { caller } = createTestCaller();
    await expect(caller.secrets.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("secrets.set", () => {
  it("stores an encrypted value and marks the secret as set", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));

    await caller.secrets.set({ key: "JENKINS_API_TOKEN", value: "ghp_abc123" });

    const list = await caller.secrets.list();
    const github = list.find((s) => s.key === "JENKINS_API_TOKEN");
    expect(github?.isSet).toBe(true);
    expect(github?.updatedAt).toBeInstanceOf(Date);

    // Stored ciphertext must not equal the plaintext.
    const row = await testDb.userSecret.findUniqueOrThrow({
      where: { userId_key: { userId: user.id, key: "JENKINS_API_TOKEN" } },
    });
    expect(row.ciphertext).not.toContain("ghp_abc123");
  });

  it("overwrites the existing value on a second set", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));

    await caller.secrets.set({ key: "JENKINS_API_TOKEN", value: "first" });
    await caller.secrets.set({ key: "JENKINS_API_TOKEN", value: "second" });

    const rows = await testDb.userSecret.findMany({
      where: { userId: user.id, key: "JENKINS_API_TOKEN" },
    });
    expect(rows).toHaveLength(1); // upsert, not a duplicate
    expect(await getUserSecret(testDb, user.id, "JENKINS_API_TOKEN")).toBe(
      "second",
    );
  });

  it("rejects an unknown secret key", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));

    await expect(
      // @ts-expect-error — exercising runtime validation of an invalid key
      caller.secrets.set({ key: "NOT_A_REAL_SECRET", value: "x" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("secrets.remove", () => {
  it("deletes a stored secret", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));

    await caller.secrets.set({ key: "JENKINS_API_TOKEN", value: "ghp_abc123" });
    await caller.secrets.remove({ key: "JENKINS_API_TOKEN" });

    const list = await caller.secrets.list();
    expect(list.find((s) => s.key === "JENKINS_API_TOKEN")?.isSet).toBe(false);
    expect(await getUserSecret(testDb, user.id, "JENKINS_API_TOKEN")).toBeNull();
  });
});

describe("getUserSecret / requireUserSecret", () => {
  it("decrypts the stored value for the owner", async () => {
    const user = await createUser();
    const { caller } = createTestCaller(sessionFor(user));
    await caller.secrets.set({ key: "JENKINS_API_TOKEN", value: "ghp_xyz" });

    expect(await getUserSecret(testDb, user.id, "JENKINS_API_TOKEN")).toBe(
      "ghp_xyz",
    );
    expect(
      await requireUserSecret(testDb, user.id, "JENKINS_API_TOKEN"),
    ).toBe("ghp_xyz");
  });

  it("returns null / throws when the secret is missing", async () => {
    const user = await createUser();

    expect(await getUserSecret(testDb, user.id, "JENKINS_API_TOKEN")).toBeNull();
    await expect(
      requireUserSecret(testDb, user.id, "JENKINS_API_TOKEN"),
    ).rejects.toThrow();
  });
});
