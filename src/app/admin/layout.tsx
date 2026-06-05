import { Box, Container } from "@chakra-ui/react";
import { type ReactNode } from "react";

import {
  Navbar,
  SECTIONS,
  SubNav,
  type NavLink,
} from "~/app/_components/navbar";
import { SecretsProvider } from "~/app/_components/secrets-context";

const adminLinks: NavLink[] = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/changelog", label: "Changelog", minRole: "ADMIN" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <SecretsProvider>
      <Box minH="100vh" bg="bg">
        <Navbar sections={SECTIONS} />
        <SubNav links={adminLinks} />
        <Container maxW="6xl" py={8}>
          {children}
        </Container>
      </Box>
    </SecretsProvider>
  );
}
