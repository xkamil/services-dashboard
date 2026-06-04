"use client";

import { Button, Text } from "@chakra-ui/react";

import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

import { AppDialog, useLastValue } from "./dialog-utils";

type DeletingUser = { id: string; email: string };

type Props = {
  user: DeletingUser | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: Props) {
  const displayUser = useLastValue(user);

  const utils = api.useUtils();
  const deleteUser = api.admin.users.delete.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      const email = displayUser?.email;
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
    <AppDialog
      open={!!user}
      onClose={onClose}
      title="Delete user"
      role="alertdialog"
      footer={
        <>
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
        </>
      }
    >
      <Text>
        Are you sure you want to delete{" "}
        <Text as="span" fontWeight="medium">
          {displayUser?.email}
        </Text>
        ? This action cannot be undone.
      </Text>
    </AppDialog>
  );
}
