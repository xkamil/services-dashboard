"use client";

import {
  Avatar,
  Box,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { api } from "~/trpc/react";

export function UserMenu() {
  const router = useRouter();
  const { data: session } = api.auth.me.useQuery();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

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
                  Admin panel
                </NextLink>
              </Menu.Item>
            )}
            <Menu.Item value="change-password" asChild>
              <NextLink href="/change-password">Change password</NextLink>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              value="theme"
              closeOnSelect={false}
              onSelect={() => setTheme(isDark ? "light" : "dark")}
            >
              <HStack justify="space-between" w="full">
                <Text>Dark mode</Text>
                <Switch.Root
                  size="sm"
                  checked={isDark}
                  pointerEvents="none"
                  aria-hidden
                >
                  <Switch.HiddenInput tabIndex={-1} />
                  <Switch.Control />
                </Switch.Root>
              </HStack>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              value="logout"
              color="red.fg"
              _hover={{ bg: "red.subtle" }}
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
