"use client";

import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { ROLE_META, coerceRole } from "~/lib/roles";
import { api } from "~/trpc/react";

import { useSecrets } from "./secrets-context";

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

  const { openSecrets } = useSecrets();

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
              <Menu.Item value="secrets" onSelect={openSecrets}>
                Secrets
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
    </>
  );
}
