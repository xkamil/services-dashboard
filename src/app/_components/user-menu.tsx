"use client";

import {
  Avatar,
  Box,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

export function UserMenu() {
  const router = useRouter();
  const { data: session } = api.auth.me.useQuery();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  if (!session) return null;
  const initial = session.email.charAt(0).toUpperCase();
  const isAdmin = session.role === "ADMIN";

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="plain"
          rounded="full"
          aria-label="Open user menu"
          p={0}
        >
          <Avatar.Root size="sm">
            <Avatar.Fallback>{initial}</Avatar.Fallback>
          </Avatar.Root>
        </IconButton>
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
            {isAdmin && (
              <Menu.Item value="admin" asChild>
                <NextLink
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Admin
                </NextLink>
              </Menu.Item>
            )}
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
