"use client";

import { Field, HStack, Input } from "@chakra-ui/react";

import { RefreshButton } from "~/app/_components/refresh-button";
import { SearchInput } from "~/app/_components/search-input";
import { MAX_AUDIT_RANGE_DAYS } from "~/lib/validation/admin";

import { clampDateInput, DAY_MS, endOfDay, toDateInput } from "./audit-dates";

/**
 * Date-range + text filter toolbar for the audit log. Owns the clamping that
 * keeps `from`..`to` inside today and within MAX_AUDIT_RANGE_DAYS.
 */
export function AuditLogFilters({
  from,
  to,
  onRangeChange,
  filter,
  onFilterChange,
  isFetching,
  onRefresh,
}: {
  from: string;
  to: string;
  onRangeChange: (range: { from: string; to: string }) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const today = toDateInput(new Date());

  // Bounds that keep the selected window within MAX_AUDIT_RANGE_DAYS.
  const fromMin = toDateInput(
    new Date(endOfDay(to).getTime() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
  );

  const handleFromChange = (value: string) => {
    onRangeChange({ from: clampDateInput(value, fromMin, to), to });
  };

  const handleToChange = (value: string) => {
    const nextTo = clampDateInput(value, from, today);
    // Keep the window within range if `to` moved far from `from`.
    const nextFromMin = toDateInput(
      new Date(endOfDay(nextTo).getTime() - MAX_AUDIT_RANGE_DAYS * DAY_MS),
    );
    let nextFrom = from;
    if (nextFrom < nextFromMin) nextFrom = nextFromMin;
    if (nextFrom > nextTo) nextFrom = nextTo;
    onRangeChange({ from: nextFrom, to: nextTo });
  };

  return (
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
          onChange={onFilterChange}
        />
      </Field.Root>
      <RefreshButton loading={isFetching} onRefresh={onRefresh} />
    </HStack>
  );
}
