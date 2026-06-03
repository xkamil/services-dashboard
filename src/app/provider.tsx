"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      disableTransitionOnChange
    >
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ThemeProvider>
  );
}
