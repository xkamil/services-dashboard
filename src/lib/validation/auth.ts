import { z } from "zod";

// Login accepts any non-empty identifier (not just valid emails) so the
// bootstrap "admin" account can sign in. Registration still requires a real
// email via registerServerSchema.
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerServerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerFormSchema = registerServerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordServerSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordFormSchema = changePasswordServerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;
