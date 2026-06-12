"use client";

import { Button, Stack, Table, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { AppDialog } from "~/app/_components/dialog-utils";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { MAX_AUDIT_RANGE_DAYS } from "~/lib/validation/admin";
import { api } from "~/trpc/react";

import { DAY_MS, endOfDay, startOfDay, toDateInput } from "./audit-dates";
import { AuditDetailsCell, formatDetails } from "./audit-log-details";
import { AuditLogFilters } from "./audit-log-filters";

export function AuditLogTable() {
  const today = toDateInput(new Date());
  const defaultFrom = toDateInput(
    new Date(Date.now() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
  );

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<string | null>(null);

  const {
    data: logs,
    isLoading,
    isFetching,
    refetch,
  } = api.admin.audit.list.useQuery({
    from: startOfDay(from),
    to: endOfDay(to),
  });

  const rows = useMemo(() => {
    if (!logs) return [];
    const filterLower = filter.trim().toLowerCase();
    if (!filterLower) return logs;

    return logs.filter((log) => {
      const haystack = [
        log.action,
        log.userEmail ?? "",
        formatDetails(log.input),
        formatDateTime(log.createdAt),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(filterLower);
    });
  }, [logs, filter]);

  return (
    <Stack gap={4}>
      <AuditLogFilters
        from={from}
        to={to}
        onRangeChange={(range) => {
          setFrom(range.from);
          setTo(range.to);
        }}
        filter={filter}
        onFilterChange={setFilter}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
      />

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <DataTable
          columnCount={4}
          isEmpty={rows.length === 0}
          emptyMessage="No changes recorded for this range."
          header={
            <>
              <Table.ColumnHeader>When</Table.ColumnHeader>
              <Table.ColumnHeader>User</Table.ColumnHeader>
              <Table.ColumnHeader>Action</Table.ColumnHeader>
              <Table.ColumnHeader>Details</Table.ColumnHeader>
            </>
          }
        >
          {rows.map((log) => (
            <Table.Row key={log.id}>
              <Table.Cell whiteSpace="nowrap">
                {formatDateTime(log.createdAt)}
              </Table.Cell>
              <Table.Cell>{log.userEmail ?? "—"}</Table.Cell>
              <Table.Cell>{log.action}</Table.Cell>
              <Table.Cell
                color="fg.muted"
                fontSize="xs"
                fontFamily="mono"
                wordBreak="break-all"
              >
                <AuditDetailsCell
                  input={log.input}
                  onShowMore={setSelectedDetails}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
      )}

      <AppDialog
        open={selectedDetails !== null}
        onClose={() => setSelectedDetails(null)}
        title="Details"
        maxW="5xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedDetails(null)}>
            Close
          </Button>
        }
      >
        <Text
          fontSize="sm"
          fontFamily="mono"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {selectedDetails}
        </Text>
      </AppDialog>
    </Stack>
  );
}
