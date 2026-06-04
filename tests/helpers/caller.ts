import type { IronSession } from "iron-session";

import { createCaller } from "~/server/api/root";
import type { SessionData } from "~/server/auth";
import { testDb } from "./prisma";

/**
 * A minimal stand-in for the iron-session cookie store. The routers only ever
 * read/assign the session fields and call `save()`/`destroy()`, so a plain
 * object that records those operations is enough — no cookie crypto required.
 */
export interface FakeIronSession extends SessionData {
  saveCount: number;
  destroyed: boolean;
  save: () => Promise<void>;
  destroy: () => void;
}

function createFakeIronSession(session: SessionData | null): FakeIronSession {
  const store: FakeIronSession = {
    userId: session?.userId ?? "",
    email: session?.email ?? "",
    role: session?.role ?? "",
    isTemporaryPassword: session?.isTemporaryPassword ?? false,
    saveCount: 0,
    destroyed: false,
    save() {
      this.saveCount += 1;
      return Promise.resolve();
    },
    destroy() {
      this.destroyed = true;
      this.userId = "";
      this.email = "";
      this.role = "";
      this.isTemporaryPassword = false;
    },
  };
  return store;
}

/**
 * Creates a tRPC caller backed by the real test database and a fake session.
 * Pass `session` to simulate a logged-in user, or `null` for an anonymous call.
 * The returned `ironSession` can be inspected to assert on login/logout effects.
 */
export function createTestCaller(session: SessionData | null = null) {
  const ironSession = createFakeIronSession(session);

  const caller = createCaller({
    db: testDb,
    session,
    ironSession: ironSession as unknown as IronSession<SessionData>,
    headers: new Headers(),
  });

  return { caller, ironSession };
}
