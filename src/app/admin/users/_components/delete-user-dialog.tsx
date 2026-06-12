"use client";

import { Text } from "@chakra-ui/react";

import { toastMutationOptions } from "~/lib/toast";
import { api } from "~/trpc/react";

import {
  AppDialog,
  DialogActions,
  useLastValue,
} from "~/app/_components/dialog-utils";

type DeletingUser = { id: string; email: string };

type Props = {
  user: DeletingUser | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: Props) {
  const displayUser = useLastValue(user);

  const utils = api.useUtils();
  const deleteUser = api.admin.users.delete.useMutation(
    toastMutationOptions({
      successTitle: "User deleted",
      successDescription: () =>
        displayUser?.email ? `${displayUser.email} has been removed.` : undefined,
      errorTitle: "Could not delete user",
      errorDescription: (error) =>
        error.message === "CANNOT_DELETE_SELF"
          ? "You cannot delete your own account."
          : "Failed to delete user. Please try again.",
      onDone: async () => {
        await utils.admin.users.list.invalidate();
        onClose();
      },
    }),
  );

  return (
    <AppDialog
      open={!!user}
      onClose={onClose}
      title="Delete user"
      role="alertdialog"
      footer={
        <DialogActions
          onCancel={onClose}
          confirmLabel="Delete"
          confirmPalette="red"
          loading={deleteUser.isPending}
          onConfirm={() => {
            if (displayUser) {
              deleteUser.mutate({ userId: displayUser.id });
            }
          }}
        />
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
