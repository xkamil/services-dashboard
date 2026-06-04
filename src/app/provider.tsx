"use client";

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  type SystemConfig,
} from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "~/app/_components/toaster";

// App-wide control sizing. Buttons (incl. IconButton/CloseButton, which wrap
// Button) and inputs default to "sm"; tables default to "sm" too. Setting these
// here keeps sizing uniform without repeating `size` on every component.
//
// Cast: without Chakra's recipe typegen, the override config types only expose
// `colorPalette` as a known variant, so `size` trips an excess-property check.
// The merge is correct at runtime (recipes keep all their variants).
const sizingConfig = {
  theme: {
    recipes: {
      button: { defaultVariants: { size: "sm" } },
      input: { defaultVariants: { size: "sm" } },
    },
    slotRecipes: {
      table: { defaultVariants: { size: "sm" } },
    },
  },
} as unknown as SystemConfig;

const system = createSystem(defaultConfig, sizingConfig);

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ChakraProvider value={system}>
        {children}
        <Toaster />
      </ChakraProvider>
    </ThemeProvider>
  );
}
