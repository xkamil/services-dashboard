"use client";

import { Box, Container, Flex, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";

export type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Container maxW="6xl">
        <Flex h="14" align="center" justify="space-between">
          <HStack gap={4} fontSize="sm">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  asChild
                  color={active ? "fg" : "fg.muted"}
                  fontWeight={active ? "semibold" : "normal"}
                  _hover={{ color: "fg", textDecoration: "none" }}
                >
                  <NextLink href={link.href}>{link.label}</NextLink>
                </Link>
              );
            })}
          </HStack>
          <UserMenu />
        </Flex>
      </Container>
    </Box>
  );
}
