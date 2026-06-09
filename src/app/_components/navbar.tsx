"use client";

import { Box, Container, Flex, HStack, Link, Text } from "@chakra-ui/react";
import { LayoutGrid } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { hasMinRole, type Role } from "~/lib/roles";
import { api } from "~/trpc/react";

import { UserMenu } from "./user-menu";

export type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  /** Minimum role required to see this link. Omitted = visible to everyone. */
  minRole?: Role;
  /**
   * Path prefix used to decide the active state, when it should differ from
   * `href`. Lets a tab link straight to a sub-page (avoiding a redirect hop)
   * while still highlighting for the whole section.
   */
  match?: string;
};

export const SECTIONS: NavLink[] = [
  { href: "/environments", label: "Environments" },
  // Link straight to the first admin page rather than `/admin` (which only
  // redirects) so client-side navigation mounts the admin layout immediately.
  {
    href: "/admin/users",
    label: "Administration",
    minRole: "ADMIN",
    match: "/admin",
  },
];

function isActive(pathname: string, link: NavLink) {
  const base = link.match ?? link.href;
  if (link.exact ?? base === "/") return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Visual styling shared by every underline tab — the main section tabs and the
 * sub-nav tabs. Keeps them identical.
 */
const navTabStyles = (active: boolean) =>
  ({
    color: active ? "fg" : "fg.muted",
    fontWeight: active ? "semibold" : "normal",
    borderBottomWidth: "2px",
    borderColor: active ? "fg" : "transparent",
    h: "full",
    display: "inline-flex",
    alignItems: "center",
    rounded: "none",
    outline: "none",
    _hover: { color: "fg", textDecoration: "none" },
    _focusVisible: { outline: "none", color: "fg", borderColor: "fg" },
  }) as const;

function NavTab({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link asChild {...navTabStyles(active)}>
      <NextLink href={link.href}>{link.label}</NextLink>
    </Link>
  );
}

function Brand() {
  return (
    <Link
      asChild
      display="inline-flex"
      alignItems="center"
      gap={2}
      color="fg"
      fontWeight="semibold"
      _hover={{ textDecoration: "none" }}
      _focusVisible={{ outline: "none" }}
    >
      <NextLink href="/">
        <LayoutGrid size={20} aria-hidden />
        <Text fontSize="md">Services Dashboard</Text>
      </NextLink>
    </Link>
  );
}

function useCanSee() {
  const { data: session } = api.auth.me.useQuery();
  return (link: NavLink) =>
    !link.minRole || (!!session && hasMinRole(session.role, link.minRole));
}

export function Navbar({ sections }: { sections: NavLink[] }) {
  const pathname = usePathname();
  const { data: session } = api.auth.me.useQuery();
  const canSee = useCanSee();

  // Only admins navigate between top-level sections; everyone else has just the
  // dashboard, so the section tabs are redundant and hidden for them.
  const isAdmin = !!session && hasMinRole(session.role, "ADMIN");

  const visibleSections = isAdmin ? sections.filter(canSee) : [];

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Container maxW="6xl">
        <Flex h="14" align="center" justify="space-between">
          <HStack gap={6} h="full">
            <Brand />

            {visibleSections.length > 0 && (
              <HStack gap={6} h="full" fontSize="sm">
                {visibleSections.map((section) => (
                  <NavTab
                    key={section.href}
                    link={section}
                    active={isActive(pathname, section)}
                  />
                ))}
              </HStack>
            )}
          </HStack>
          <UserMenu />
        </Flex>
      </Container>
    </Box>
  );
}

/**
 * Secondary navigation bar rendered below the main navbar. Used for the links
 * within a section (e.g. the admin area's Users / Changelog). Only the links
 * the current user may see are shown.
 */
export function SubNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const canSee = useCanSee();

  const visibleLinks = links.filter(canSee);
  if (visibleLinks.length === 0) return null;

  return (
    <Box
      as="nav"
      position="sticky"
      top="14"
      zIndex="docked"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Container maxW="6xl">
        <HStack gap={6} h="11" fontSize="sm">
          {visibleLinks.map((link) => (
            <NavTab
              key={link.href}
              link={link}
              active={isActive(pathname, link)}
            />
          ))}
        </HStack>
      </Container>
    </Box>
  );
}
