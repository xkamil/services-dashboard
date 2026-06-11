"use client";

import { Box, Container, Flex, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import type { ColorToken } from "~/lib/config/environment-type";
import { hasMinRole, type Role } from "~/lib/roles";
import { api } from "~/trpc/react";

import { UserMenu } from "./user-menu";
import { ViewOptionsMenu } from "./view-options-menu";

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
  /**
   * Explicit colour used to tint the tab (label + bottom border) while it is
   * active. Inactive tabs are unaffected.
   */
  accentColor?: ColorToken;
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
const navTabStyles = (active: boolean, accentColor?: ColorToken) => {
  // When a tab is active and carries an accent colour, tint its label and bottom
  // border with that exact colour (so the two match); otherwise fall back to the
  // neutral `fg`. The shade itself is owned by the caller (e.g. the env type).
  const accent = accentColor ?? "fg";
  return {
    color: active ? accent : "fg.muted",
    fontWeight: active ? "semibold" : "normal",
    borderBottomWidth: "2px",
    borderColor: active ? accent : "transparent",
    h: "full",
    display: "inline-flex",
    alignItems: "center",
    rounded: "none",
    outline: "none",
    _hover: { color: accent, textDecoration: "none" },
    _focusVisible: { outline: "none", color: accent, borderColor: accent },
  } as const;
};

function NavTab({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link asChild {...navTabStyles(active, link.accentColor)}>
      <NextLink href={link.href}>{link.label}</NextLink>
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
  const canSee = useCanSee();

  const visibleSections = sections.filter(canSee);

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
            <HStack gap={6} h="full" fontSize="sm">
              {visibleSections.map((section) => (
                <NavTab
                  key={section.href}
                  link={section}
                  active={isActive(pathname, section)}
                />
              ))}
            </HStack>
          </HStack>
          <HStack gap={1}>
            <ViewOptionsMenu />
            <UserMenu />
          </HStack>
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

  // Colour the bar's bottom border with the active link's accent colour (e.g.
  // the selected environment's stage colour); neutral border when none.
  const accent = visibleLinks.find((l) => isActive(pathname, l))?.accentColor;

  return (
    <Box
      as="nav"
      position="sticky"
      top="14"
      zIndex="docked"
      borderBottomWidth="1px"
      borderColor={accent ?? "border"}
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
