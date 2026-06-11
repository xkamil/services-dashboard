"use client";

import {
  HStack,
  IconButton,
  Menu,
  Portal,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Moon, Settings, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

/**
 * A single toggle row inside the view-options menu. Presentational only — the
 * caller owns the checked state and `onToggle`, so it works equally for the
 * theme (backed by next-themes) and for localStorage-backed show/hide toggles
 * (see {@link usePersistentToggle}).
 */
function ViewToggleItem({
  value,
  label,
  icon,
  checked,
  onToggle,
}: {
  value: string;
  label: string;
  icon: ReactNode;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Menu.Item value={value} closeOnSelect={false} onSelect={onToggle}>
      <HStack justify="space-between" w="full">
        <HStack gap={2}>
          {icon}
          <Text>{label}</Text>
        </HStack>
        <Switch.Root size="sm" checked={checked} pointerEvents="none" aria-hidden>
          <Switch.HiddenInput tabIndex={-1} />
          <Switch.Control />
        </Switch.Root>
      </HStack>
    </Menu.Item>
  );
}

/**
 * "View options" menu — controls what the user sees (theme, and later show/hide
 * toggles for UI sections). Sits left of the user menu in the navbar. New
 * toggles are added as {@link ViewToggleItem}s; persist them with
 * {@link usePersistentToggle}.
 */
export function ViewOptionsMenu() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          rounded="full"
          aria-label="View options"
          size="sm"
          mr={2}
        >
          <Settings2 size={23} aria-hidden />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="220px">
            <ViewToggleItem
              value="theme"
              label="Dark mode"
              icon={
                isDark ? (
                  <Moon size={16} aria-hidden />
                ) : (
                  <Sun size={16} aria-hidden />
                )
              }
              checked={isDark}
              onToggle={() => setTheme(isDark ? "light" : "dark")}
            />
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
