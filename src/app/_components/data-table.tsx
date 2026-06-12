"use client";

import { Box, Table, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

/**
 * Bordered, horizontally scrollable table with the app's standard
 * empty-state row. `header` renders inside the header Table.Row;
 * `children` are the body rows, shown only when `isEmpty` is false.
 */
export function DataTable({
  header,
  columnCount,
  isEmpty,
  emptyMessage,
  children,
}: {
  header: ReactNode;
  columnCount: number;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" overflowX="auto">
      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>{header}</Table.Row>
        </Table.Header>
        <Table.Body>
          {isEmpty ? (
            <Table.Row>
              <Table.Cell colSpan={columnCount}>
                <Text textAlign="center" color="fg.muted" py={4}>
                  {emptyMessage}
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            children
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
