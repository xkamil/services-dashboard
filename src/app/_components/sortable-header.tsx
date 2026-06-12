"use client";

import { Box, HStack, Table, Text } from "@chakra-ui/react";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

import type { SortDir } from "./use-table-sort";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <Box as="span" opacity={0.4} display="inline-flex">
        <ChevronsUpDown size={14} aria-hidden />
      </Box>
    );
  }
  return (
    <Box as="span" display="inline-flex">
      {dir === "asc" ? (
        <ChevronUp size={14} aria-hidden />
      ) : (
        <ChevronDown size={14} aria-hidden />
      )}
    </Box>
  );
}

/** Clickable column header showing the sort state from `useTableSort`. */
export function SortableColumnHeader({
  label,
  active,
  dir,
  onToggle,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onToggle: () => void;
}) {
  return (
    <Table.ColumnHeader
      cursor="pointer"
      onClick={onToggle}
      _hover={{ bg: "bg.muted" }}
      userSelect="none"
    >
      <HStack gap={1}>
        <Text>{label}</Text>
        <SortIcon active={active} dir={dir} />
      </HStack>
    </Table.ColumnHeader>
  );
}
