import { z } from "zod";

/** Identifies a single service on a single environment to look up its version. */
export const serviceVersionSchema = z.object({
  envName: z.string().min(1),
  serviceName: z.string().min(1),
});
