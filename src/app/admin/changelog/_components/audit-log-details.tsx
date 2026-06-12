"use client";

import { Link } from "@chakra-ui/react";

const MAX_DETAILS_LENGTH = 200;

/** Renders a sanitized audit-log input snapshot as a compact one-liner. */
export function formatDetails(input: string | null): string {
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

/**
 * The details column content: the formatted snapshot, truncated with a
 * "more" link that hands the full text to the parent (for its dialog).
 */
export function AuditDetailsCell({
  input,
  onShowMore,
}: {
  input: string | null;
  onShowMore: (details: string) => void;
}) {
  const details = formatDetails(input);
  if (details.length <= MAX_DETAILS_LENGTH) {
    return <>{details}</>;
  }
  return (
    <>
      {details.slice(0, MAX_DETAILS_LENGTH)}…{" "}
      <Link
        as="button"
        type="button"
        color="fg.info"
        fontFamily="body"
        onClick={() => onShowMore(details)}
      >
        more
      </Link>
    </>
  );
}
