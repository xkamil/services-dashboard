import { Box, Container, Flex, Heading, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";

import { UserMenu } from "./user-menu";

export function Navbar() {
  return (
    <Box
      as="nav"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Container maxW="6xl">
        <Flex h="14" align="center" justify="space-between">
          <HStack gap={6}>
            <Heading size="md" asChild>
              <NextLink href="/">Services Dashboard</NextLink>
            </Heading>
            <HStack gap={4} fontSize="sm">
              <Link asChild color="fg.muted" _hover={{ color: "fg" }}>
                <NextLink href="/">Dashboard</NextLink>
              </Link>
            </HStack>
          </HStack>
          <UserMenu />
        </Flex>
      </Container>
    </Box>
  );
}
