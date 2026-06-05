"use client";

import {
  Button,
  Field,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, FormAlert } from "~/app/(auth)/_components/auth-card";
import {
  type RegisterFormInput,
  registerFormSchema,
} from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export default function RegisterPage() {
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
    },
  });

  const register = api.auth.register.useMutation({
    onSuccess: () => {
      setSuccessMsg("Account created. You can now sign in.");
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

  const onSubmit = ({ email, password }: RegisterFormInput) => {
    setErrorMsg("");
    register.mutate({ email, password });
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
