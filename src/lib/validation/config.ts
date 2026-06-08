import { z } from "zod";

import { appConfigSchema } from "~/lib/config/schema";

export const saveConfigSchema = z.object({
  data: appConfigSchema,
  message: z.string().max(500).optional(),
});

export const configVersionSchema = z.object({
  version: z.number().int().positive(),
});

export const revertConfigSchema = configVersionSchema;

export const resolveConfigSchema = z.object({
  envName: z.string().min(1).optional(),
});

export const diffConfigSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
});
