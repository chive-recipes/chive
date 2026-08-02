import { Secp256k1Keypair } from "@atproto/crypto";
import { describe, expect, it } from "vitest";
import {
  CHIVE_SERVICE_DID,
  TRACK_USER_METHOD,
  verifyTrackingToken,
} from "./service-auth";

const DID = "did:plc:testuser";
const NOW = 1_800_000_000;

function encodeBase64Url(value: string | Uint8Array): string {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function createToken(
  keypair: Secp256k1Keypair,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const header = encodeBase64Url(
    JSON.stringify({ typ: "JWT", alg: keypair.jwtAlg }),
  );
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: DID,
      aud: CHIVE_SERVICE_DID,
      lxm: TRACK_USER_METHOD,
      iat: NOW,
      exp: NOW + 60,
      jti: "unique-token-id",
      ...overrides,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = await keypair.sign(new TextEncoder().encode(signingInput));
  return `${signingInput}.${encodeBase64Url(signature)}`;
}

describe("verifyTrackingToken", () => {
  it("accepts a valid DID-signed service token", async () => {
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(keypair);

    await expect(
      verifyTrackingToken(token, DID, {
        now: NOW,
        resolveKey: async () => keypair.did(),
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects tokens issued for another service", async () => {
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(keypair, { aud: "did:web:attacker.test" });

    await expect(
      verifyTrackingToken(token, DID, {
        now: NOW,
        resolveKey: async () => keypair.did(),
      }),
    ).rejects.toThrow("audience");
  });

  it("rejects expired tokens", async () => {
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(keypair, {
      iat: NOW - 120,
      exp: NOW - 60,
    });

    await expect(
      verifyTrackingToken(token, DID, {
        now: NOW,
        resolveKey: async () => keypair.did(),
      }),
    ).rejects.toThrow("validity window");
  });

  it("rejects a signature made by a different DID key", async () => {
    const signer = await Secp256k1Keypair.create();
    const expected = await Secp256k1Keypair.create();
    const token = await createToken(signer);

    await expect(
      verifyTrackingToken(token, DID, {
        now: NOW,
        resolveKey: async () => expected.did(),
      }),
    ).rejects.toThrow("signature");
  });
});
