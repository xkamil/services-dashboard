import { Box, Container } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { Navbar, SECTIONS, type NavLink } from "~/app/_components/navbar";

const adminLinks: NavLink[] = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/changelog", label: "Changelog" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Box minH="100vh" bg="bg">
      <Navbar sections={SECTIONS} links={adminLinks} />
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}
