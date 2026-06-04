"use client";

import { Box, Container, Flex, HStack, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";

export type NavLink = { href: string; label: string; exact?: boolean };

export const SECTIONS: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/admin", label: "Administration" },
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
  const currentSection =
    sections.find((section) => isActive(pathname, section)) ?? sections[0];

  return (
    <Box as="nav" borderBottomWidth="1px" borderColor="border" bg="bg.panel">
      <Container maxW="6xl">
        <Flex h="14" align="center" justify="space-between">
          <HStack gap={6} h="full">
            <Text fontSize="md" fontWeight="semibold">
              {currentSection?.label}
            </Text>

            {links.length > 0 && (
              <>
                <Text color="fg.muted" aria-hidden>
                  |
                </Text>
                <HStack gap={6} h="full" fontSize="sm">
                  {links.map((link) => (
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
