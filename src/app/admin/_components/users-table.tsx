"use client";

import {
  Box,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { StatusBadge } from "~/app/_components/status-badge";
import { formatDateTime } from "~/lib/format";
import { type UserStatus, userStatusSchema } from "~/lib/validation/admin";
import { api } from "~/trpc/react";

import { ChangeStatusDialog } from "./change-status-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type SortField = "id" | "email" | "status" | "role" | "createdAt" | "updatedAt";
type SortDir = "asc" | "desc";

type EditingUser = { id: string; email: string; status: UserStatus };
type DeletingUser = { id: string; email: string };
type ResettingUser = { id: string; email: string };

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Text as="span" opacity={0.3}>↕</Text>;
  return <Text as="span">{dir === "asc" ? "↑" : "↓"}</Text>;
}

export function UsersTable() {
  const { data: users, isLoading } = api.admin.users.list.useQuery();

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [deleting, setDeleting] = useState<DeletingUser | null>(null);
  const [resetting, setResetting] = useState<ResettingUser | null>(null);

  const rows = useMemo(() => {
    if (!users) return [];

    const filterLower = filter.trim().toLowerCase();
    const filtered = filterLower
      ? users.filter((u) =>
          [u.id, u.email, u.status, u.role].some((v) =>
            v.toLowerCase().includes(filterLower),
          ),
        )
      : users;

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      let cmp = 0;
      if (aVal instanceof Date && bVal instanceof Date) {
        cmp = aVal.getTime() - bVal.getTime();
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [users, filter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortableHeader = (field: SortField, label: string) => (
    <Table.ColumnHeader
      cursor="pointer"
      onClick={() => toggleSort(field)}
      _hover={{ bg: "bg.muted" }}
      userSelect="none"
    >
      <HStack gap={1}>
        <Text>{label}</Text>
        <SortIcon active={sortField === field} dir={sortDir} />
      </HStack>
    </Table.ColumnHeader>
  );

  return (
    <Stack gap={4}>
      <Input
        placeholder="Filter by ID, email, status, or role…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        maxW="sm"
      />

      {isLoading ? (
        <Stack gap={2}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h="10" />
          ))}
        </Stack>
      ) : (
        <Box borderWidth="1px" borderColor="border" rounded="md" overflow="hidden">
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row>
                {sortableHeader("id", "User ID")}
                {sortableHeader("email", "Email")}
                {sortableHeader("status", "Status")}
                {sortableHeader("role", "Role")}
                {sortableHeader("createdAt", "Created")}
                {sortableHeader("updatedAt", "Updated")}
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text textAlign="center" color="fg.muted" py={4}>
                      No users match the filter.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((user) => {
                  const status = userStatusSchema.parse(user.status);
                  return (
                    <Table.Row key={user.id}>
                      <Table.Cell fontFamily="mono" fontSize="xs" color="fg.muted">
                        {user.id}
                      </Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <StatusBadge status={status} />
                      </Table.Cell>
                      <Table.Cell>{user.role}</Table.Cell>
                      <Table.Cell>{formatDateTime(user.createdAt)}</Table.Cell>
                      <Table.Cell>{formatDateTime(user.updatedAt)}</Table.Cell>
                      <Table.Cell textAlign="end">
                        <Menu.Root>
                          <Menu.Trigger asChild>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              aria-label="User actions"
                            >
                              <Text as="span" fontSize="md" lineHeight="1">
                                ⋮
                              </Text>
                            </IconButton>
                          </Menu.Trigger>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content minW="180px">
                                <Menu.Item
                                  value="change-status"
                                  onSelect={() =>
                                    setEditing({
                                      id: user.id,
                                      email: user.email,
                                      status,
                                    })
                                  }
                                >
                                  Change status
                                </Menu.Item>
                                <Menu.Item
                                  value="reset-password"
                                  onSelect={() =>
                                    setResetting({
                                      id: user.id,
                                      email: user.email,
                                    })
                                  }
                                >
                                  Reset password
                                </Menu.Item>
                                <Menu.Separator />
                                <Menu.Item
                                  value="delete"
                                  color="red.fg"
                                  _hover={{ bg: "red.subtle" }}
                                  onSelect={() =>
                                    setDeleting({
                                      id: user.id,
                                      email: user.email,
                                    })
                                  }
                                >
                                  Delete user
                                </Menu.Item>
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <ChangeStatusDialog user={editing} onClose={() => setEditing(null)} />
      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
      />
    </Stack>
  );
}
