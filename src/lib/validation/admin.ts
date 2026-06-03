import { z } from "zod";

export const userStatusSchema = z.enum([
  "ACTIVE",
  "BLOCKED",
  "PENDING_VERIFICATION",
]);

export type UserStatus = z.infer<typeof userStatusSchema>;

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: userStatusSchema,
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
