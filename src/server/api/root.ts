import { adminRouter } from "~/server/api/routers/admin";
import { authRouter } from "~/server/api/routers/auth";
import { secretsRouter } from "~/server/api/routers/secrets";
import { versionRouter } from "~/server/api/routers/version";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  secrets: secretsRouter,
  version: versionRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
