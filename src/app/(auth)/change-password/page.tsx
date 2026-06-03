"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  type ChangePasswordFormInput,
  changePasswordFormSchema,
} from "~/lib/validation/auth";
import { api } from "~/trpc/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

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
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box bg="white" p={8} rounded="lg" shadow="md" w="full" maxW="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={6}>
            <Stack gap={1}>
              <Heading size="xl" textAlign="center">Set new password</Heading>
              <Text fontSize="sm" textAlign="center" color="gray.500">
                Your password is temporary. Please set a new one to continue.
              </Text>
            </Stack>

            {errorMsg && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="md" p={3}>
                <Text color="red.600" fontSize="sm">{errorMsg}</Text>
              </Box>
            )}

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
      </Box>
    </Box>
  );
}
