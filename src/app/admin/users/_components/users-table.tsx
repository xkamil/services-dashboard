"use client";

import { HStack, Stack, Table } from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { RefreshButton } from "~/app/_components/refresh-button";
import { RoleBadge } from "~/app/_components/role-badge";
import { SearchInput } from "~/app/_components/search-input";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { SortableColumnHeader } from "~/app/_components/sortable-header";
import { useTableSort } from "~/app/_components/use-table-sort";
import { formatDateTime } from "~/lib/format";
import { coerceRole, hasMinRole, type Role } from "~/lib/roles";
import { api } from "~/trpc/react";

import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserActionsMenu } from "./user-actions-menu";

type SortField = "id" | "email" | "role" | "createdAt" | "updatedAt";

type EditingRoleUser = { id: string; email: string; role: Role };
type DeletingUser = { id: string; email: string };
type ResettingUser = { id: string; email: string };

export function UsersTable() {
  const {
    data: users,
    isLoading,
    isFetching,
    refetch,
  } = api.admin.users.list.useQuery();
  const { data: session } = api.auth.me.useQuery();
  const canManage = !!session && hasMinRole(session.role, "SUPER_ADMIN");

  const [filter, setFilter] = useState("");
  const [editingRole, setEditingRole] = useState<EditingRoleUser | null>(null);
  const [deleting, setDeleting] = useState<DeletingUser | null>(null);
  const [resetting, setResetting] = useState<ResettingUser | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    const filterLower = filter.trim().toLowerCase();
    if (!filterLower) return users;
    return users.filter((u) =>
      [u.id, u.email, u.role].some((v) =>
        v.toLowerCase().includes(filterLower),
      ),
    );
  }, [users, filter]);

  const {
    sorted: rows,
    sortField,
    sortDir,
    toggleSort,
  } = useTableSort(filtered, "createdAt", "desc");

  const sortableHeader = (field: SortField, label: string) => (
    <SortableColumnHeader
      label={label}
      active={sortField === field}
      dir={sortDir}
      onToggle={() => toggleSort(field)}
    />
  );

  return (
    <Stack gap={4}>
      <HStack gap={4} align="center">
        <SearchInput
          placeholder="Filter by ID, email, or role…"
          value={filter}
          onChange={setFilter}
          maxW="sm"
        />
        <RefreshButton
          loading={isFetching}
          onRefresh={() => void refetch()}
          ml="auto"
        />
      </HStack>

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <DataTable
          columnCount={canManage ? 6 : 5}
          isEmpty={rows.length === 0}
          emptyMessage="No users match the filter."
          header={
            <>
              {sortableHeader("id", "User ID")}
              {sortableHeader("email", "Email")}
              {sortableHeader("role", "Role")}
              {sortableHeader("createdAt", "Created")}
              {sortableHeader("updatedAt", "Updated")}
              {canManage && (
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              )}
            </>
          }
        >
          {rows.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell fontFamily="mono" fontSize="xs" color="fg.muted">
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
                  <UserActionsMenu
                    onChangeRole={() =>
                      setEditingRole({
                        id: user.id,
                        email: user.email,
                        role: coerceRole(user.role) ?? "USER",
                      })
                    }
                    onResetPassword={() =>
                      setResetting({ id: user.id, email: user.email })
                    }
                    onDelete={() =>
                      setDeleting({ id: user.id, email: user.email })
                    }
                  />
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </DataTable>
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
