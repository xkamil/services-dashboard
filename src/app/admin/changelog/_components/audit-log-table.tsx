"use client";

import {
  Box,
  Field,
  HStack,
  Input,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { SearchInput } from "~/app/_components/search-input";
import { formatDateTime } from "~/lib/format";
import { MAX_AUDIT_RANGE_DAYS } from "~/lib/validation/admin";
import { api } from "~/trpc/react";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function clampDateInput(value: string, min: string, max: string) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function startOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function endOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function formatDetails(input: string | null): string {
  if (!input) return "—";
  try {
    const parsed: unknown = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>);
      if (entries.length === 0) return "—";
      return entries
        .map(([key, value]) => {
          const rendered =
            value && typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
          return `${key}: ${rendered}`;
        })
        .join(", ");
    }
    return JSON.stringify(parsed);
  } catch {
    return input;
  }
}

export function AuditLogTable() {
  const today = toDateInput(new Date());
  const defaultFrom = toDateInput(
    new Date(Date.now() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
  );

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [filter, setFilter] = useState("");

  // Bounds that keep the selected window within MAX_AUDIT_RANGE_DAYS.
  const fromMin = toDateInput(
    new Date(endOfDay(to).getTime() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
  );

  const { data: logs, isLoading } = api.admin.audit.list.useQuery({
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

  const handleFromChange = (value: string) => {
    setFrom(clampDateInput(value, fromMin, to));
  };

  const handleToChange = (value: string) => {
    const nextTo = clampDateInput(value, from, today);
    setTo(nextTo);
    // Keep the window within range if `to` moved far from `from`.
    const nextFromMin = toDateInput(
      new Date(endOfDay(nextTo).getTime() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
    );
    if (from < nextFromMin) setFrom(nextFromMin);
    if (from > nextTo) setFrom(nextTo);
  };

  return (
    <Stack gap={4}>
      <HStack gap={4} align="end" wrap="wrap">
        <Field.Root maxW="3xs">
          <Field.Label>From</Field.Label>
          <Input
            type="date"
            value={from}
            min={fromMin}
            max={to}
            onChange={(e) => handleFromChange(e.target.value)}
          />
        </Field.Root>
        <Field.Root maxW="3xs">
          <Field.Label>To</Field.Label>
          <Input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </Field.Root>
        <Field.Root flex="1" minW="3xs">
          <Field.Label>Search</Field.Label>
          <SearchInput
            placeholder="Filter by action, user, or details…"
            value={filter}
            onChange={setFilter}
          />
        </Field.Root>
      </HStack>

      <Text fontSize="xs" color="fg.muted">
        Showing up to {MAX_AUDIT_RANGE_DAYS} days of changes.
      </Text>

      {isLoading ? (
        <Stack gap={2}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h="10" />
          ))}
        </Stack>
      ) : (
        <Box
          borderWidth="1px"
          borderColor="border"
          rounded="md"
          overflowX="auto"
        >
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>When</Table.ColumnHeader>
                <Table.ColumnHeader>User</Table.ColumnHeader>
                <Table.ColumnHeader>Action</Table.ColumnHeader>
                <Table.ColumnHeader>Details</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <Text textAlign="center" color="fg.muted" py={4}>
                      No changes recorded for this range.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((log) => (
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
                      {formatDetails(log.input)}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Stack>
  );
}
