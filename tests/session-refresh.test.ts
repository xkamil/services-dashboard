import type { IronSession } from "iron-session";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { SessionData } from "~/server/auth";
import { MAX_SESSION_AGE_MS, refreshSessionIfStale } from "~/server/auth";
import { createUser, sessionFor } from "./helpers/fixtures";
import { resetDb, testDb } from "./helpers/prisma";

beforeEach(resetDb);
afterAll(() => testDb.$disconnect());

/** A minimal session store that records save/destroy, like the caller helper. */
function fakeSession(data: SessionData) {
  const store = {
    ...data,
    saveCount: 0,
    destroyed: false,
    save() {
      this.saveCount += 1;
      return Promise.resolve();
    },
    destroy() {
      this.destroyed = true;
      this.userId = "";
      this.role = "";
    },
  };
  return store as typeof store & IronSession<SessionData>;
}

describe("refreshSessionIfStale", () => {
  it("returns null for an anonymous (empty) session", async () => {
    const session = fakeSession({
      userId: "",
      email: "",
      role: "",
      isTemporaryPassword: false,
    });
    expect(await refreshSessionIfStale(session, testDb)).toBeNull();
  });

  it("trusts the cookie role within the window without touching the DB", async () => {
    // Logged in as SUPER_ADMIN moments ago, then downgraded in the DB.
    const user = await createUser({ role: "SUPER_ADMIN" });
    const session = fakeSession({
      ...sessionFor(user),
      refreshedAt: Date.now(),
    });
    await testDb.user.update({
      where: { id: user.id },
      data: { role: "USER" },
    });

    const resolved = await refreshSessionIfStale(session, testDb);

    // Still SUPER_ADMIN until the window lapses — the accepted trade-off.
    expect(resolved?.role).toBe("SUPER_ADMIN");
    expect(session.saveCount).toBe(0);
  });

  it("re-validates and rewrites the cookie once the session is stale", async () => {
    const user = await createUser({ role: "SUPER_ADMIN" });
    const session = fakeSession({
      ...sessionFor(user),
      refreshedAt: Date.now() - (MAX_SESSION_AGE_MS + 1_000),
    });
    await testDb.user.update({
      where: { id: user.id },
      data: { role: "USER" },
    });

    const before = Date.now();
    const resolved = await refreshSessionIfStale(session, testDb);

    // Authorization now sees the downgraded role...
    expect(resolved?.role).toBe("USER");
    // ...the cookie is rewritten with the fresh role and a new stamp...
    expect(session.role).toBe("USER");
    expect(session.refreshedAt).toBeGreaterThanOrEqual(before);
    expect(session.saveCount).toBe(1);
  });

  it("treats a missing refreshedAt (legacy cookie) as stale", async () => {
    const user = await createUser({ role: "ADMIN" });
    // No refreshedAt at all — a cookie issued before the field existed.
    const session = fakeSession(sessionFor(user));
    await testDb.user.update({
      where: { id: user.id },
      data: { role: "USER" },
    });

    const resolved = await refreshSessionIfStale(session, testDb);

    expect(resolved?.role).toBe("USER");
    expect(session.saveCount).toBe(1);
  });

  it("destroys the session when a stale user has been deleted", async () => {
    const user = await createUser({ role: "ADMIN" });
    const session = fakeSession({
      ...sessionFor(user),
      refreshedAt: Date.now() - (MAX_SESSION_AGE_MS + 1_000),
    });
    await testDb.user.delete({ where: { id: user.id } });

    expect(await refreshSessionIfStale(session, testDb)).toBeNull();
    expect(session.destroyed).toBe(true);
  });
});
