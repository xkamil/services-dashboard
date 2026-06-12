import { createTRPCRouter } from "~/server/api/trpc/init";
import { configRouter } from "~/server/api/routers/config";

import { auditRouter } from "./audit";
import { usersRouter } from "./users";

/**
 * Everything under `admin.*` — the audit middleware records all successful
 * mutations on this path prefix to the changelog.
 */
export const adminRouter = createTRPCRouter({
  users: usersRouter,
  audit: auditRouter,
  config: configRouter,
});
