import { Box } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { Navbar, SECTIONS } from "~/app/_components/navbar";
import { SecretsProvider } from "~/app/_components/secrets-context";

// Only the top navbar is shared here; each section (e.g. environments) renders
// its own sub-nav and container, mirroring how the admin area is laid out.
export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <SecretsProvider>
      <Box minH="100vh" bg="bg">
        <Navbar sections={SECTIONS} />
        {children}
      </Box>
    </SecretsProvider>
  );
}
