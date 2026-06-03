import { Box, Container } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { Navbar, type NavLink } from "~/app/_components/navbar";

const links: NavLink[] = [{ href: "/admin", label: "Admin" }];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Box minH="100vh" bg="bg">
      <Navbar links={links} />
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}
