"use client";

import { Box, Button, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

export function UserMenu() {
  const router = useRouter();
  const { data: session } = api.auth.me.useQuery();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  if (!session) return null;
  const username = session.email.split("@")[0];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm">
          {username}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="220px">
            <Box px={3} py={2}>
              <Stack gap={0.5}>
                <Text fontSize="sm" fontWeight="medium">
                  {session.email}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {session.role}
                </Text>
              </Stack>
            </Box>
            <Menu.Separator />
            <Menu.Item
              value="logout"
              onSelect={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Sign out
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
