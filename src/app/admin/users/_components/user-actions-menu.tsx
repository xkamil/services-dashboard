"use client";

import { IconButton, Menu, Portal } from "@chakra-ui/react";
import { MoreVertical } from "lucide-react";

/** Per-row actions menu for super admins on the users table. */
export function UserActionsMenu({
  onChangeRole,
  onResetPassword,
  onDelete,
}: {
  onChangeRole: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" aria-label="User actions">
          <MoreVertical size={16} aria-hidden />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="180px">
            <Menu.Item value="change-role" onSelect={onChangeRole}>
              Change role
            </Menu.Item>
            <Menu.Item value="reset-password" onSelect={onResetPassword}>
              Reset password
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              value="delete"
              color="red.fg"
              _hover={{ bg: "red.subtle" }}
              onSelect={onDelete}
            >
              Delete user
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
