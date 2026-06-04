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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, FormAlert } from "~/app/(auth)/_components/auth-card";
import { type LoginInput, loginSchema } from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = api.auth.login.useMutation({
    onSuccess: ({ requiresPasswordChange }) => {
      router.push(requiresPasswordChange ? "/change-password" : "/");
    },
    onError: (error) => {
      if (error.message === "ACCOUNT_BLOCKED") {
        setErrorMsg("Your account has been blocked. Contact an administrator.");
      } else if (error.message === "ACCOUNT_PENDING_VERIFICATION") {
        setErrorMsg("Your account is pending verification.");
      } else {
        setErrorMsg("Invalid email or password.");
      }
    },
  });

  const onSubmit = (data: LoginInput) => {
    setErrorMsg("");
    login.mutate(data);
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Heading size="xl" textAlign="center">
            Sign in
          </Heading>

          {errorMsg && <FormAlert tone="error">{errorMsg}</FormAlert>}

          <Stack gap={4}>
            <Field.Root invalid={!!errors.email}>
              <Field.Label>Email</Field.Label>
              <Input
                type="text"
                placeholder="you@example.com"
                {...register("email")}
              />
              <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.password}>
              <Field.Label>Password</Field.Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>
          </Stack>

          <Button
            type="submit"
            colorPalette="blue"
            width="full"
            loading={login.isPending}
          >
            Sign in
          </Button>

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" color="blue.fg" fontWeight="medium">
              Register
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthCard>
  );
}
