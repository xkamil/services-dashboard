import { z } from "zod";

import { SECRET_KEYS } from "~/lib/secrets";

export const setSecretSchema = z.object({
  key: z.enum(SECRET_KEYS),
  value: z.string().min(1, "Value is required").max(4096),
});

export type SetSecretInput = z.infer<typeof setSecretSchema>;

export const removeSecretSchema = z.object({
  key: z.enum(SECRET_KEYS),
});
