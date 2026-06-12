"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { AppDialog } from "~/app/_components/dialog-utils";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { MAX_AUDIT_RANGE_DAYS } from "~/lib/validation/admin";
import { api, type RouterOutputs } from "~/trpc/react";

import { DAY_MS, endOfDay, startOfDay, toDateInput } from "./audit-dates";
import { AuditDetailsCell, formatDetails } from "./audit-log-details";
import { AuditLogFilters } from "./audit-log-filters";

type AuditRow = RouterOutputs["admin"]["audit"]["list"][number];

const columnHelper = createColumnHelper<AuditRow>();

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

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: "When",
        sortingFn: "datetime",
        cell: ({ getValue }) => formatDateTime(getValue()),
        meta: { cellProps: { whiteSpace: "nowrap" } },
      }),
      columnHelper.accessor((log) => log.userEmail ?? "", {
        id: "userEmail",
        header: "User",
        cell: ({ row }) => row.original.userEmail ?? "—",
      }),
      columnHelper.accessor("action", { header: "Action" }),
      columnHelper.display({
        id: "details",
        header: "Details",
        meta: {
          cellProps: {
            color: "fg.muted",
            fontSize: "xs",
            fontFamily: "mono",
            wordBreak: "break-all",
          },
        },
        cell: ({ row }) => (
          <AuditDetailsCell
            input={row.original.input}
            onShowMore={setSelectedDetails}
          />
        ),
      }),
    ],
    [],
  );

  const data = useMemo(() => logs ?? [], [logs]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (log) => log.id,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _columnId, value: string) => {
      const filterLower = value.trim().toLowerCase();
      if (!filterLower) return true;
      const log = row.original;
      const haystack = [
        log.action,
        log.userEmail ?? "",
        formatDetails(log.input),
        formatDateTime(log.createdAt),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(filterLower);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
          table={table}
          emptyMessage="No changes recorded for this range."
        />
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
