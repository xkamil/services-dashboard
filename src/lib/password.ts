import { randomInt } from "node:crypto";

// Ambiguous-looking characters (0/O, 1/l/I) are excluded so the temporary
// password is easy to read out or copy without confusion.
const CHAR_SETS = {
  lower: "abcdefghijkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digit: "23456789",
  symbol: "!@#$%^&*",
} as const;

const ALL_CHARS = Object.values(CHAR_SETS).join("");

function pick(chars: string): string {
  return chars[randomInt(chars.length)]!;
}

/**
 * Generates a cryptographically random temporary password that always contains
 * at least one lowercase letter, uppercase letter, digit and symbol.
 */
export function generateTemporaryPassword(length = 16): string {
  const targetLength = Math.max(length, 8);

  const chars = Object.values(CHAR_SETS).map(pick);
  while (chars.length < targetLength) {
    chars.push(pick(ALL_CHARS));
  }

  // Fisher-Yates shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}
