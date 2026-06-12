/** Pure date helpers for the audit-log date-range filter. */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Formats a Date as the `yyyy-mm-dd` value used by `<input type="date">`. */
export function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function clampDateInput(value: string, min: string, max: string) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function startOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function endOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}
