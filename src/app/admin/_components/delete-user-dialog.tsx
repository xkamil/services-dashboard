"use client";

import { Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";

import { api } from "~/trpc/react";

type DeletingUser = { id: string; email: string };

type Props = {
  user: DeletingUser | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: Props) {
  const [errorMsg, setErrorMsg] = useState("");
  const lastUserRef = useRef<DeletingUser | null>(null);
  if (user) lastUserRef.current = user;
  const displayUser = user ?? lastUserRef.current;

  const utils = api.useUtils();
  const deleteUser = api.admin.users.delete.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      onClose();
    },
    onError: (error) => {
      if (error.message === "CANNOT_DELETE_SELF") {
        setErrorMsg("You cannot delete your own account.");
      } else {
        setErrorMsg("Failed to delete user. Please try again.");
      }
    },
  });

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(e) => {
        if (!e.open) {
          setErrorMsg("");
          onClose();
        }
      }}
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete user</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                <Text>
                  Are you sure you want to delete{" "}
                  <Text as="span" fontWeight="medium">
                    {displayUser?.email}
                  </Text>
                  ? This action cannot be undone.
                </Text>
                {errorMsg && (
                  <Text fontSize="sm" color="red.fg">
                    {errorMsg}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorPalette="red"
                loading={deleteUser.isPending}
                onClick={() => {
                  if (displayUser) {
                    setErrorMsg("");
                    deleteUser.mutate({ userId: displayUser.id });
                  }
                }}
              >
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
