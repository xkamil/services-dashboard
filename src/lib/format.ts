/** Formats a date as DD.MM.YYYY, HH:MM in local time. */
export function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
}
