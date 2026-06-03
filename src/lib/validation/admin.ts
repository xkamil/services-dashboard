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
