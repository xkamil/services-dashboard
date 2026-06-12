"use client";

import { Box, HStack, Table, Text } from "@chakra-ui/react";
import {
  flexRender,
  type Header,
  type RowData,
  type SortDirection,
  type Table as TableInstance,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Chakra props applied to the column's header cell. */
    headerProps?: ComponentProps<typeof Table.ColumnHeader>;
    /** Chakra props applied to every body cell in the column. */
    cellProps?: ComponentProps<typeof Table.Cell>;
  }
}

function SortIcon({ sorted }: { sorted: false | SortDirection }) {
  if (!sorted) {
    return (
      <Box as="span" opacity={0.4} display="inline-flex">
        <ChevronsUpDown size={14} aria-hidden />
      </Box>
    );
  }
  return (
    <Box as="span" display="inline-flex">
      {sorted === "asc" ? (
        <ChevronUp size={14} aria-hidden />
      ) : (
        <ChevronDown size={14} aria-hidden />
      )}
    </Box>
  );
}

function HeaderCell<Row>({ header }: { header: Header<Row, unknown> }) {
  const { headerProps } = header.column.columnDef.meta ?? {};
  const content = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());

  if (!header.column.getCanSort()) {
    return <Table.ColumnHeader {...headerProps}>{content}</Table.ColumnHeader>;
  }
  return (
    <Table.ColumnHeader
      cursor="pointer"
      onClick={header.column.getToggleSortingHandler()}
      _hover={{ bg: "bg.muted" }}
      userSelect="none"
      {...headerProps}
    >
      <HStack gap={1}>
        <Text>{content}</Text>
        <SortIcon sorted={header.column.getIsSorted()} />
      </HStack>
    </Table.ColumnHeader>
  );
}

/**
 * Bordered, horizontally scrollable table rendered from a TanStack Table
 * instance. Headers of sortable columns are clickable and show the sort
 * state; per-column Chakra styling comes from `meta.headerProps` /
 * `meta.cellProps` on the column definition.
 */
export function DataTable<Row>({
  table,
  emptyMessage,
}: {
  table: TableInstance<Row>;
  emptyMessage: string;
}) {
  const rows = table.getRowModel().rows;
  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" overflowX="auto">
      <Table.Root variant="line">
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <HeaderCell key={header.id} header={header} />
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={table.getVisibleLeafColumns().length}>
                <Text textAlign="center" color="fg.muted" py={4}>
                  {emptyMessage}
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    key={cell.id}
                    {...cell.column.columnDef.meta?.cellProps}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
