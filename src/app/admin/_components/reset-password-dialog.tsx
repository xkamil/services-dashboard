"use client";

import {
  Button,
  Clipboard,
  Code,
  Dialog,
  HStack,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRef } from "react";

import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

type ResettingUser = { id: string; email: string };

type Props = {
  user: ResettingUser | null;
  onClose: () => void;
};

export function ResetPasswordDialog({ user, onClose }: Props) {
  const lastUserRef = useRef<ResettingUser | null>(null);
  if (user) lastUserRef.current = user;
  const displayUser = user ?? lastUserRef.current;

  const resetPassword = api.admin.users.resetPassword.useMutation({
    onSuccess: () => {
      const email = lastUserRef.current?.email;
      showSuccessToast("Password reset", {
        description: email
          ? `A temporary password was generated for ${email}.`
          : undefined,
      });
    },
    onError: (error) => {
      showErrorToast("Could not reset password", {
        description: "Failed to reset the password. Please try again.",
        details: error.message,
      });
    },
  });
  const generatedPassword = resetPassword.data?.password;

  const handleClose = () => {
    resetPassword.reset();
    onClose();
  };

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
      role="alertdialog"
      closeOnInteractOutside={!generatedPassword}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Reset password</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {generatedPassword ? (
                <Stack gap={4}>
                  <Text>
                    A new temporary password has been generated for{" "}
                    <Text as="span" fontWeight="medium">
                      {displayUser?.email}
                    </Text>
                    . Copy it and send it to the user — they will be required to
                    set a new password on their next login.
                  </Text>
                  <Clipboard.Root value={generatedPassword} timeout={1500}>
                    <HStack gap={2} align="stretch">
                      <Code
                        flex="1"
                        p={3}
                        fontSize="sm"
                        wordBreak="break-all"
                        rounded="md"
                      >
                        {generatedPassword}
                      </Code>
                      <Clipboard.Trigger asChild>
                        <Button variant="outline" minW="20">
                          <Clipboard.Indicator copied="Copied">
                            Copy
                          </Clipboard.Indicator>
                        </Button>
                      </Clipboard.Trigger>
                    </HStack>
                  </Clipboard.Root>
                  <Text fontSize="sm" color="fg.muted">
                    This password won&apos;t be shown again after you close
                    this dialog.
                  </Text>
                </Stack>
              ) : (
                <Text>
                  Are you sure you want to reset the password for{" "}
                  <Text as="span" fontWeight="medium">
                    {displayUser?.email}
                  </Text>
                  ? Their current password will stop working and a new temporary
                  password will be generated.
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {generatedPassword ? (
                <Button onClick={handleClose}>Done</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    colorPalette="orange"
                    loading={resetPassword.isPending}
                    onClick={() => {
                      if (displayUser) {
                        resetPassword.mutate({ userId: displayUser.id });
                      }
                    }}
                  >
                    Reset password
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
