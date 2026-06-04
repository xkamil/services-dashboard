"use client";

import { Box, Container, Flex, HStack, Link, Text } from "@chakra-ui/react";
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
};

export const SECTIONS: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/admin", label: "Administration", minRole: "ADMIN" },
];

function isActive(pathname: string, link: NavLink) {
  if (link.exact ?? link.href === "/") return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function NavTab({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      asChild
      color={active ? "fg" : "fg.muted"}
      fontWeight={active ? "semibold" : "normal"}
      borderBottomWidth="2px"
      borderColor={active ? "fg" : "transparent"}
      h="full"
      display="inline-flex"
      alignItems="center"
      rounded="none"
      outline="none"
      _hover={{ color: "fg", textDecoration: "none" }}
      _focusVisible={{ outline: "none", color: "fg", borderColor: "fg" }}
    >
      <NextLink href={link.href}>{link.label}</NextLink>
    </Link>
  );
}

export function Navbar({
  sections,
  links = [],
}: {
  sections: NavLink[];
  links?: NavLink[];
}) {
  const pathname = usePathname();
  const { data: session } = api.auth.me.useQuery();

  const canSee = (link: NavLink) =>
    !link.minRole || (!!session && hasMinRole(session.role, link.minRole));

  const visibleSections = sections.filter(canSee);
  const visibleLinks = links.filter(canSee);

  const currentSection =
    visibleSections.find((section) => isActive(pathname, section)) ??
    visibleSections[0];

  return (
    <Box as="nav" borderBottomWidth="1px" borderColor="border" bg="bg.panel">
      <Container maxW="6xl">
        <Flex h="14" align="center" justify="space-between">
          <HStack gap={6} h="full">
            <Text fontSize="md" fontWeight="semibold">
              {currentSection?.label}
            </Text>

            {visibleLinks.length > 0 && (
              <>
                <Text color="fg.muted" aria-hidden>
                  |
                </Text>
                <HStack gap={6} h="full" fontSize="sm">
                  {visibleLinks.map((link) => (
                    <NavTab
                      key={link.href}
                      link={link}
                      active={isActive(pathname, link)}
                    />
                  ))}
                </HStack>
              </>
            )}
          </HStack>
          <UserMenu />
        </Flex>
      </Container>
    </Box>
  );
}
