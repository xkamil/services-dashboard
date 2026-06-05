import { z } from "zod";

import { ROLES } from "~/lib/roles";

export const roleSchema = z.enum(ROLES);

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
});

export const MAX_AUDIT_RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const auditLogListSchema = z
  .object({
    from: z.date(),
    to: z.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "validation.dateRangeOrder",
    path: ["from"],
  })
  .refine(
    (data) =>
      Math.floor((data.to.getTime() - data.from.getTime()) / DAY_MS) <=
      MAX_AUDIT_RANGE_DAYS,
    {
      message: "validation.dateRangeTooLong",
      path: ["from"],
    },
  );
