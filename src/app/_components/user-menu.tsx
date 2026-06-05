"use client";

import {
  Avatar,
  Badge,
  Box,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ROLE_META, coerceRole } from "~/lib/roles";
import { api } from "~/trpc/react";

import { SecretsDialog } from "./secrets-dialog";

/** Border color for the menu trigger, by user role. */
function roleBorderColor(role: string) {
  const known = coerceRole(role);
  const palette = known ? ROLE_META[known].palette : "gray";
  return `${palette}.emphasized`;
}

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

  const [secretsOpen, setSecretsOpen] = useState(false);

  if (!session) return null;
  const initial = session.email.charAt(0).toUpperCase();
  const knownRole = coerceRole(session.role);
  const roleLabel = knownRole ? ROLE_META[knownRole].label : session.role;

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="plain"
            rounded="full"
            aria-label="Open user menu"
            p={0}
            h="auto"
            minH="0"
            w="auto"
            minW="0"
            borderWidth="2px"
            borderStyle="solid"
            borderColor={roleBorderColor(session.role)}
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
                <Stack gap={1.5} align="start">
                  <Text fontSize="sm" fontWeight="medium">
                    {session.email}
                  </Text>
                  <Badge size="sm" variant="subtle" colorPalette="gray">
                    {roleLabel}
                  </Badge>
                </Stack>
              </Box>
              <Menu.Separator />
              <Menu.Item value="change-password" asChild>
                <NextLink href="/change-password">Change password</NextLink>
              </Menu.Item>
              <Menu.Item value="secrets" onSelect={() => setSecretsOpen(true)}>
                Secrets
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item
                value="theme"
                closeOnSelect={false}
                onSelect={() => setTheme(isDark ? "light" : "dark")}
              >
                <HStack justify="space-between" w="full">
                  <HStack gap={2}>
                    {isDark ? (
                      <Moon size={16} aria-hidden />
                    ) : (
                      <Sun size={16} aria-hidden />
                    )}
                    <Text>Dark mode</Text>
                  </HStack>
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
      <SecretsDialog
        open={secretsOpen}
        onClose={() => setSecretsOpen(false)}
      />
    </>
  );
}
