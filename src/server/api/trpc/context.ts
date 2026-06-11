import { getSession, refreshSessionIfStale } from "~/server/auth";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSession();
  // Trust the cookie's role for a short window; once the session is stale the
  // role is re-validated against the database and the cookie rewritten, so a
  // role change can't outlive the window. Runs in a Route Handler, where the
  // cookie write is allowed.
  const sessionData = await refreshSessionIfStale(session, db);

  return {
    db,
    session: sessionData,
    ironSession: session,
    ...opts,
  };
};
