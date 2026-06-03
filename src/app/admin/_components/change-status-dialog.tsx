"use client";

import {
  Button,
  Dialog,
  Field,
  NativeSelect,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { type UserStatus, userStatusSchema } from "~/lib/validation/admin";
import { api } from "~/trpc/react";

type EditingUser = { id: string; email: string; status: UserStatus };

type Props = {
  user: EditingUser | null;
  onClose: () => void;
};

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
];

export function ChangeStatusDialog({ user, onClose }: Props) {
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const lastUserRef = useRef<EditingUser | null>(null);
  if (user) lastUserRef.current = user;
  const displayUser = user ?? lastUserRef.current;

  useEffect(() => {
    if (user) setStatus(user.status);
  }, [user]);

  const utils = api.useUtils();
  const updateStatus = api.admin.users.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.admin.users.list.invalidate();
      onClose();
    },
  });

  const isUnchanged = !displayUser || status === displayUser.status;

  return (
    <Dialog.Root
      open={!!user}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Change user status</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
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
            </Dialog.Body>
            <Dialog.Footer>
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
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
