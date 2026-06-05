"use client";

import {
  Box,
  HStack,
  IconButton,
  Menu,
  Portal,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import { useMemo, useState } from "react";

import { RoleBadge } from "~/app/_components/role-badge";
import { SearchInput } from "~/app/_components/search-input";
import { formatDateTime } from "~/lib/format";
import { coerceRole, hasMinRole, type Role } from "~/lib/roles";
import { api } from "~/trpc/react";

import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type SortField = "id" | "email" | "role" | "createdAt" | "updatedAt";
type SortDir = "asc" | "desc";

type EditingRoleUser = { id: string; email: string; role: Role };
type DeletingUser = { id: string; email: string };
type ResettingUser = { id: string; email: string };

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return (
      <Box as="span" opacity={0.4} display="inline-flex">
        <ChevronsUpDown size={14} aria-hidden />
      </Box>
    );
  return (
    <Box as="span" display="inline-flex">
      {dir === "asc" ? (
        <ChevronUp size={14} aria-hidden />
      ) : (
        <ChevronDown size={14} aria-hidden />
      )}
    </Box>
  );
}

export function UsersTable() {
  const { data: users, isLoading } = api.admin.users.list.useQuery();
  const { data: session } = api.auth.me.useQuery();
  const canManage = !!session && hasMinRole(session.role, "SUPER_ADMIN");

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");
  const [editingRole, setEditingRole] = useState<EditingRoleUser | null>(null);
  const [deleting, setDeleting] = useState<DeletingUser | null>(null);
  const [resetting, setResetting] = useState<ResettingUser | null>(null);

  const rows = useMemo(() => {
    if (!users) return [];

    const filterLower = filter.trim().toLowerCase();
    const filtered = filterLower
      ? users.filter((u) =>
          [u.id, u.email, u.role].some((v) =>
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
      <SearchInput
        placeholder="Filter by ID, email, or role…"
        value={filter}
        onChange={setFilter}
        maxW="sm"
      />

      {isLoading ? (
        <Stack gap={2}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h="10" />
          ))}
        </Stack>
      ) : (
        <Box
          borderWidth="1px"
          borderColor="border"
          rounded="md"
          overflowX="auto"
        >
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                {sortableHeader("id", "User ID")}
                {sortableHeader("email", "Email")}
                {sortableHeader("role", "Role")}
                {sortableHeader("createdAt", "Created")}
                {sortableHeader("updatedAt", "Updated")}
                {canManage && (
                  <Table.ColumnHeader textAlign="end">
                    Actions
                  </Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={canManage ? 6 : 5}>
                    <Text textAlign="center" color="fg.muted" py={4}>
                      No users match the filter.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((user) => {
                  return (
                    <Table.Row key={user.id}>
                      <Table.Cell
                        fontFamily="mono"
                        fontSize="xs"
                        color="fg.muted"
                      >
                        {user.id}
                      </Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <RoleBadge role={user.role} />
                      </Table.Cell>
                      <Table.Cell>{formatDateTime(user.createdAt)}</Table.Cell>
                      <Table.Cell>{formatDateTime(user.updatedAt)}</Table.Cell>
                      {canManage && (
                        <Table.Cell textAlign="end">
                          <Menu.Root>
                            <Menu.Trigger asChild>
                              <IconButton
                                variant="ghost"
                                aria-label="User actions"
                              >
                                <MoreVertical size={16} aria-hidden />
                              </IconButton>
                            </Menu.Trigger>
                            <Portal>
                              <Menu.Positioner>
                                <Menu.Content minW="180px">
                                  <Menu.Item
                                    value="change-role"
                                    onSelect={() =>
                                      setEditingRole({
                                        id: user.id,
                                        email: user.email,
                                        role:
                                          coerceRole(user.role) ?? "USER",
                                      })
                                    }
                                  >
                                    Change role
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
                      )}
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <ChangeRoleDialog
        user={editingRole}
        onClose={() => setEditingRole(null)}
      />
      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
      />
    </Stack>
  );
}
