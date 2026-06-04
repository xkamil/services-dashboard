"use client";

import {
  Button,
  Field,
  Heading,
  Input,
  Link,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, FormAlert } from "~/app/(auth)/_components/auth-card";
import { ROLE_META, ROLES } from "~/lib/roles";
import {
  type RegisterFormInput,
  registerFormSchema,
} from "~/lib/validation/auth";
import { api } from "~/trpc/react";

// Roles a user may request when self-registering. SUPER_ADMIN is intentionally
// excluded — that role is only ever assigned by an existing super admin.
const REQUESTABLE_ROLES = ROLES.filter((role) => role !== "SUPER_ADMIN");

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "NON_TECHNICAL",
    },
  });

  const register = api.auth.register.useMutation({
    onSuccess: ({ isFirstUser }) => {
      if (isFirstUser) {
        router.push("/login");
      } else {
        setSuccessMsg(
          "Account created. Please wait for an administrator to verify your account.",
        );
      }
    },
    onError: (error) => {
      if (error.message === "EMAIL_TAKEN") {
        setErrorMsg(
          "An account with this email already exists. Try signing in instead.",
        );
      } else if (error.data?.code === "BAD_REQUEST") {
        setErrorMsg(
          "Please check your details — some fields didn't pass validation.",
        );
      } else {
        setErrorMsg(
          "We couldn't create your account right now. Please check your connection and try again.",
        );
      }
    },
  });

  const onSubmit = ({ email, password, role }: RegisterFormInput) => {
    setErrorMsg("");
    register.mutate({ email, password, role });
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Heading size="xl" textAlign="center">
            Create account
          </Heading>

          {errorMsg && <FormAlert tone="error">{errorMsg}</FormAlert>}

          {successMsg && <FormAlert tone="success">{successMsg}</FormAlert>}

          {!successMsg && (
            <>
              <Stack gap={4}>
                <Field.Root invalid={!!errors.email}>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...formRegister("email")}
                  />
                  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label>Password</Field.Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    {...formRegister("password")}
                  />
                  <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <Field.Label>Confirm password</Field.Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...formRegister("confirmPassword")}
                  />
                  <Field.ErrorText>
                    {errors.confirmPassword?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.role}>
                  <Field.Label>Requested role</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field {...formRegister("role")}>
                      {REQUESTABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_META[role].label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Field.HelperText>
                    An administrator will confirm your role when verifying your
                    account.
                  </Field.HelperText>
                  <Field.ErrorText>{errors.role?.message}</Field.ErrorText>
                </Field.Root>
              </Stack>

              <Button
                type="submit"
                colorPalette="blue"
                width="full"
                loading={register.isPending}
              >
                Register
              </Button>
            </>
          )}

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Already have an account?{" "}
            <Link href="/login" color="blue.fg" fontWeight="medium">
              Sign in
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthCard>
  );
}
