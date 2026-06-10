import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SESSION_SECRET: z.string().min(32),
    // Base64-encoded 32 random bytes (~44 chars). Used to encrypt user secrets.
    SECRETS_ENCRYPTION_KEY: z.string().min(44),
    DATABASE_URL: z.string().url(),
    // How long a session's role is trusted before being re-validated against
    // the database. Optional; defaults to 60 seconds.
    SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(60),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {},
  runtimeEnv: {
    SESSION_SECRET: process.env.SESSION_SECRET,
    SECRETS_ENCRYPTION_KEY: process.env.SECRETS_ENCRYPTION_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_MAX_AGE_SECONDS: process.env.SESSION_MAX_AGE_SECONDS,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
