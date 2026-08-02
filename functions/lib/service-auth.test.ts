import { Secp256k1Keypair } from "@atproto/crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  CHIVE_SERVICE_AUDIENCE,
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
  headerOverrides: Record<string, unknown> = {},
): Promise<string> {
  const header = encodeBase64Url(
    JSON.stringify({ typ: "JWT", alg: keypair.jwtAlg, ...headerOverrides }),
  );
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: DID,
      aud: CHIVE_SERVICE_AUDIENCE,
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
  it("matches the service published by Chive's did:web document", async () => {
    const didDocument = JSON.parse(
      await readFile(
        resolve(process.cwd(), "public/.well-known/did.json"),
        "utf8",
      ),
    ) as { service?: Array<{ id?: unknown }> };

    expect(didDocument.service?.some(
      (service) => service.id === CHIVE_SERVICE_AUDIENCE,
    )).toBe(true);
  });

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

  it("accepts optional claims omitted by an interoperable PDS", async () => {
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(
      keypair,
      { iat: undefined, jti: undefined },
      { typ: undefined },
    );

    await expect(
      verifyTrackingToken(token, DID, {
        now: NOW,
        resolveKey: async () => keypair.did(),
      }),
    ).resolves.toBeUndefined();
  });

  it("resolves and verifies a Multikey from a PLC DID document", async () => {
    const plcDid = "did:plc:aaaaaaaaaaaaaaaaaaaaaaaa";
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(keypair, { iss: plcDid });
    const publicKeyMultibase = keypair.did().slice("did:key:".length);
    const didDocument = JSON.stringify({
      id: plcDid,
      verificationMethod: [
        {
          id: `${plcDid}#atproto`,
          type: "Multikey",
          publicKeyMultibase,
        },
      ],
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(didDocument, {
        status: 200,
        headers: { "Content-Length": String(didDocument.length) },
      }),
    );

    try {
      await expect(
        verifyTrackingToken(token, plcDid, { now: NOW }),
      ).resolves.toBeUndefined();
      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(`https://plc.directory/${encodeURIComponent(plcDid)}`),
        expect.objectContaining({ redirect: "manual" }),
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("does not follow redirects while resolving a DID document", async () => {
    const plcDid = "did:plc:aaaaaaaaaaaaaaaaaaaaaaaa";
    const keypair = await Secp256k1Keypair.create();
    const token = await createToken(keypair, { iss: plcDid });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: "https://example.com/untrusted" },
      }),
    );

    try {
      await expect(
        verifyTrackingToken(token, plcDid, { now: NOW }),
      ).rejects.toMatchObject({ code: "did_resolution_failed" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      fetchSpy.mockRestore();
    }
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
