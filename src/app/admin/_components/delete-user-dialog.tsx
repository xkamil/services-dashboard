"use client";

import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import { useRef } from "react";

import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

type DeletingUser = { id: string; email: string };

type Props = {
  user: DeletingUser | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: Props) {
  const lastUserRef = useRef<DeletingUser | null>(null);
  if (user) lastUserRef.current = user;
  const displayUser = user ?? lastUserRef.current;

  const utils = api.useUtils();
  const deleteUser = api.admin.users.delete.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      const email = lastUserRef.current?.email;
      onClose();
      showSuccessToast("User deleted", {
        description: email ? `${email} has been removed.` : undefined,
      });
    },
    onError: (error) => {
      const description =
        error.message === "CANNOT_DELETE_SELF"
          ? "You cannot delete your own account."
          : "Failed to delete user. Please try again.";
      showErrorToast("Could not delete user", {
        description,
        details: error.message,
      });
    },
  });

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(e) => {
        if (!e.open) onClose();
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
              <Text>
                Are you sure you want to delete{" "}
                <Text as="span" fontWeight="medium">
                  {displayUser?.email}
                </Text>
                ? This action cannot be undone.
              </Text>
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
