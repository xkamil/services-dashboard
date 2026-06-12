"use client";

import { HStack, Stack } from "@chakra-ui/react";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { RefreshButton } from "~/app/_components/refresh-button";
import { RoleBadge } from "~/app/_components/role-badge";
import { SearchInput } from "~/app/_components/search-input";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { coerceRole, hasMinRole, type Role } from "~/lib/roles";
import { api, type RouterOutputs } from "~/trpc/react";

import { ChangeRoleDialog } from "./change-role-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserActionsMenu } from "./user-actions-menu";

type UserRow = RouterOutputs["admin"]["users"]["list"][number];

type EditingRoleUser = { id: string; email: string; role: Role };
type DeletingUser = { id: string; email: string };
type ResettingUser = { id: string; email: string };

const columnHelper = createColumnHelper<UserRow>();

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

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "User ID",
        meta: {
          cellProps: { fontFamily: "mono", fontSize: "xs", color: "fg.muted" },
        },
      }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: ({ getValue }) => <RoleBadge role={getValue()} />,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        sortingFn: "datetime",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Updated",
        sortingFn: "datetime",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      ...(canManage
        ? [
            columnHelper.display({
              id: "actions",
              header: "Actions",
              meta: {
                headerProps: { textAlign: "end" },
                cellProps: { textAlign: "end" },
              },
              cell: ({ row }) => {
                const user = row.original;
                return (
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
                );
              },
            }),
          ]
        : []),
    ],
    [canManage],
  );

  const data = useMemo(() => users ?? [], [users]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (user) => user.id,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value: string) => {
      const filterLower = value.trim().toLowerCase();
      if (!filterLower) return true;
      const user = row.original;
      return [user.id, user.email, user.role].some((v) =>
        v.toLowerCase().includes(filterLower),
      );
    },
    initialState: { sorting: [{ id: "createdAt", desc: true }] },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
        <DataTable table={table} emptyMessage="No users match the filter." />
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
