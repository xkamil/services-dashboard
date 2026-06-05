"use client";

import { Button, Field, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { showErrorToast, showSuccessToast } from "~/lib/toast";
import {
  USER_STATUS_META,
  type UserStatus,
  userStatusSchema,
} from "~/lib/validation/admin";
import { api } from "~/trpc/react";

import { AppDialog, useLastValue } from "~/app/_components/dialog-utils";

type EditingUser = { id: string; email: string; status: UserStatus };

type Props = {
  user: EditingUser | null;
  onClose: () => void;
};

const STATUS_OPTIONS = userStatusSchema.options.map((value) => ({
  value,
  label: USER_STATUS_META[value].label,
}));

export function ChangeStatusDialog({ user, onClose }: Props) {
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const displayUser = useLastValue(user);

  useEffect(() => {
    if (user) setStatus(user.status);
  }, [user]);

  const utils = api.useUtils();
  const updateStatus = api.admin.users.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      const email = displayUser?.email;
      onClose();
      showSuccessToast("Status updated", {
        description: email ? `${email} is now ${status}.` : undefined,
      });
    },
    onError: (error) => {
      showErrorToast("Could not update status", {
        description: "Failed to update the user status. Please try again.",
        details: error.message,
      });
    },
  });

  const isUnchanged = !displayUser || status === displayUser.status;

  return (
    <AppDialog
      open={!!user}
      onClose={onClose}
      title="Change user status"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="blue"
            loading={updateStatus.isPending}
            disabled={isUnchanged}
            onClick={() => {
              if (displayUser) {
                updateStatus.mutate({ userId: displayUser.id, status });
              }
            }}
          >
            Confirm
          </Button>
        </>
      }
    >
      {displayUser && (
        <Stack gap={4}>
          <Text fontSize="sm" color="fg.muted">
            User:{" "}
            <Text as="span" color="fg" fontWeight="medium">
              {displayUser.email}
            </Text>
          </Text>
          <Field.Root>
            <Field.Label>New status</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={status}
                onChange={(e) => {
                  const parsed = userStatusSchema.safeParse(
                    e.currentTarget.value,
                  );
                  if (parsed.success) setStatus(parsed.data);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </Stack>
      )}
    </AppDialog>
  );
}
