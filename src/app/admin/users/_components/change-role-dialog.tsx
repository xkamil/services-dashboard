"use client";

import { Button, Field, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { ROLE_META, type Role } from "~/lib/roles";
import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { roleSchema } from "~/lib/validation/admin";
import { api } from "~/trpc/react";

import { AppDialog, useLastValue } from "~/app/_components/dialog-utils";

type EditingUser = { id: string; email: string; role: Role };

type Props = {
  user: EditingUser | null;
  onClose: () => void;
};

const ROLE_OPTIONS = roleSchema.options.map((value) => ({
  value,
  label: ROLE_META[value].label,
}));

export function ChangeRoleDialog({ user, onClose }: Props) {
  const [role, setRole] = useState<Role>("USER");
  const displayUser = useLastValue(user);

  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  const utils = api.useUtils();
  const updateRole = api.admin.users.updateRole.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      const email = displayUser?.email;
      onClose();
      showSuccessToast("Role updated", {
        description: email
          ? `${email} is now ${ROLE_META[role].label}.`
          : undefined,
      });
    },
    onError: (error) => {
      showErrorToast("Could not update role", {
        description: "Failed to update the user role. Please try again.",
        details: error.message,
      });
    },
  });

  const isUnchanged = !displayUser || role === displayUser.role;

  return (
    <AppDialog
      open={!!user}
      onClose={onClose}
      title="Change user role"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="blue"
            loading={updateRole.isPending}
            disabled={isUnchanged}
            onClick={() => {
              if (displayUser) {
                updateRole.mutate({ userId: displayUser.id, role });
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
            <Field.Label>New role</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={role}
                onChange={(e) => {
                  const parsed = roleSchema.safeParse(e.currentTarget.value);
                  if (parsed.success) setRole(parsed.data);
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
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
