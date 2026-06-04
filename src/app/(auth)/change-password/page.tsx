"use client";

import { Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, FormAlert } from "~/app/(auth)/_components/auth-card";
import {
  type ChangePasswordFormInput,
  changePasswordFormSchema,
} from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  const { data: session } = api.auth.me.useQuery();
  const isTemporaryPassword = session?.isTemporaryPassword ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const changePassword = api.auth.changePassword.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: () => {
      setErrorMsg("Failed to change password. Please try again.");
    },
  });

  const onSubmit = ({ newPassword }: ChangePasswordFormInput) => {
    setErrorMsg("");
    changePassword.mutate({ newPassword });
  };

  return (
    <AuthCard>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Stack gap={1}>
            <Heading size="xl" textAlign="center">
              Set new password
            </Heading>
            <Text fontSize="sm" textAlign="center" color="fg.muted">
              {isTemporaryPassword
                ? "Your password is temporary. Please set a new one to continue."
                : "Enter a new password for your account."}
            </Text>
          </Stack>

          {errorMsg && <FormAlert tone="error">{errorMsg}</FormAlert>}

          <Stack gap={4}>
            <Field.Root invalid={!!errors.newPassword}>
              <Field.Label>New password</Field.Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                {...register("newPassword")}
              />
              <Field.ErrorText>{errors.newPassword?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.confirmPassword}>
              <Field.Label>Confirm new password</Field.Label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
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
            loading={changePassword.isPending}
          >
            Set password
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
