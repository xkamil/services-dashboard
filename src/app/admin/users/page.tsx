import { Heading, Stack } from "@chakra-ui/react";

import { UsersTable } from "~/app/admin/_components/users-table";

export default function AdminUsersPage() {
  return (
    <Stack gap={6}>
      <Heading size="2xl">Users</Heading>
      <UsersTable />
    </Stack>
  );
}
