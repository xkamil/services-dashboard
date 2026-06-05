import crypto from "node:crypto";

import { env } from "~/env";

// AES-256-GCM: authenticated encryption so tampering with stored ciphertext is
// detected on decrypt. The 256-bit key comes from SECRETS_ENCRYPTION_KEY.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM

const KEY = Buffer.from(env.SECRETS_ENCRYPTION_KEY, "base64");
if (KEY.length !== 32) {
  throw new Error(
    "SECRETS_ENCRYPTION_KEY must be base64 for exactly 32 bytes (256 bits).",
  );
}

/**
 * Encrypts a plaintext secret. Returns a self-contained string in the form
 * `base64(iv).base64(authTag).base64(ciphertext)` suitable for DB storage.
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(".");
}

/** Reverses {@link encryptSecret}. Throws if the payload is malformed or tampered. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret payload.");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
