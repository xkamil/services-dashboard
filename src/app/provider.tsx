"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "~/app/_components/toaster";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      disableTransitionOnChange
    >
      <ChakraProvider value={defaultSystem}>
        {children}
        <Toaster />
      </ChakraProvider>
    </ThemeProvider>
  );
}
