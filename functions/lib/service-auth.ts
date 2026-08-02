import {
  formatDidKey,
  multibaseToBytes,
  P256_JWT_ALG,
  parseMultikey,
  SECP256K1_JWT_ALG,
  verifySignature,
} from "@atproto/crypto";

export const CHIVE_SERVICE_AUDIENCE =
  "did:web:chive.pages.dev#chive_tracker";
export const TRACK_USER_METHOD = "com.chive.actor.track";

const MAX_TOKEN_LENGTH = 4096;
const MAX_TOKEN_LIFETIME_SECONDS = 5 * 60;
const CLOCK_SKEW_SECONDS = 30;

type SigningKeyResolver = (
  did: string,
  forceRefresh: boolean,
) => Promise<string>;

interface ServiceTokenHeader {
  alg: "ES256" | "ES256K";
  typ?: string;
}

interface ServiceTokenPayload {
  iss: string;
  aud: string;
  lxm?: string;
  iat?: number;
  exp: number;
  jti?: string;
}

export type ServiceAuthErrorCode =
  | "malformed_token"
  | "invalid_issuer"
  | "invalid_audience"
  | "invalid_method"
  | "invalid_time"
  | "did_resolution_failed"
  | "invalid_signature";

export class ServiceAuthError extends Error {
  constructor(
    public readonly code: ServiceAuthErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ServiceAuthError";
  }
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseJsonPart(value: string): unknown {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function parseHeader(value: string): ServiceTokenHeader {
  let header: Partial<ServiceTokenHeader>;
  try {
    header = parseJsonPart(value) as Partial<ServiceTokenHeader>;
  } catch (cause) {
    throw new ServiceAuthError(
      "malformed_token",
      "Invalid service token header",
      { cause },
    );
  }
  if (
    !header ||
    typeof header !== "object" ||
    (header.alg !== "ES256" && header.alg !== "ES256K") ||
    (header.typ !== undefined && header.typ !== "JWT")
  ) {
    throw new ServiceAuthError(
      "malformed_token",
      "Invalid service token header",
    );
  }
  return header as ServiceTokenHeader;
}

function parsePayload(value: string): ServiceTokenPayload {
  let payload: Partial<ServiceTokenPayload>;
  try {
    payload = parseJsonPart(value) as Partial<ServiceTokenPayload>;
  } catch (cause) {
    throw new ServiceAuthError(
      "malformed_token",
      "Invalid service token payload",
      { cause },
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.iss !== "string" ||
    typeof payload.aud !== "string" ||
    !Number.isInteger(payload.exp) ||
    (payload.lxm !== undefined && typeof payload.lxm !== "string") ||
    (payload.iat !== undefined && !Number.isInteger(payload.iat)) ||
    (payload.jti !== undefined &&
      (typeof payload.jti !== "string" ||
        payload.jti.length === 0 ||
        payload.jti.length > 256))
  ) {
    throw new ServiceAuthError(
      "malformed_token",
      "Invalid service token payload",
    );
  }
  return payload as ServiceTokenPayload;
}

interface DidVerificationMethod {
  id?: unknown;
  type?: unknown;
  publicKeyMultibase?: unknown;
}

interface DidDocument {
  id?: unknown;
  verificationMethod?: unknown;
}

function didDocumentUrl(did: string): URL {
  if (/^did:plc:[a-z2-7]{24}$/.test(did)) {
    return new URL(`/${encodeURIComponent(did)}`, "https://plc.directory");
  }

  if (!did.startsWith("did:web:")) {
    throw new Error("Unsupported DID method");
  }

  const encodedAuthority = did.slice("did:web:".length);
  if (!encodedAuthority || encodedAuthority.includes(":")) {
    throw new Error("ATProto does not support path-based did:web identifiers");
  }
  const authority = decodeURIComponent(encodedAuthority);
  if (!/^[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(authority)) {
    throw new Error("Invalid did:web authority");
  }

  const url = new URL(`https://${authority}/.well-known/did.json`);
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    !hostname.includes(".") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname) ||
    hostname.includes(":")
  ) {
    throw new Error("Refusing unsafe did:web hostname");
  }
  return url;
}

async function fetchDidDocument(did: string): Promise<DidDocument> {
  const response = await fetch(didDocumentUrl(did), {
    redirect: "error",
    headers: { Accept: "application/did+ld+json, application/json" },
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("DID resolution failed");

  const declaredLength = Number(response.headers.get("Content-Length") ?? "0");
  if (declaredLength > 1_000_000) throw new Error("DID document is too large");
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error("DID document is too large");

  const document = JSON.parse(body) as DidDocument;
  if (document.id !== did || !Array.isArray(document.verificationMethod)) {
    throw new Error("Invalid DID document");
  }
  return document;
}

function signingKeyFromDocument(document: DidDocument, did: string): string {
  const methods = document.verificationMethod as DidVerificationMethod[];
  const method = methods.find((entry) => entry.id === `${did}#atproto`);
  if (!method || typeof method.publicKeyMultibase !== "string") {
    throw new Error("DID document is missing its ATProto signing key");
  }

  if (method.type === "Multikey") {
    const parsed = parseMultikey(method.publicKeyMultibase);
    return formatDidKey(parsed.jwtAlg, parsed.keyBytes);
  }

  const keyBytes = multibaseToBytes(method.publicKeyMultibase);
  if (method.type === "EcdsaSecp256r1VerificationKey2019") {
    return formatDidKey(P256_JWT_ALG, keyBytes);
  }
  if (method.type === "EcdsaSecp256k1VerificationKey2019") {
    return formatDidKey(SECP256K1_JWT_ALG, keyBytes);
  }
  throw new Error("Unsupported ATProto signing key type");
}

const resolveSigningKey: SigningKeyResolver = async (did) =>
  signingKeyFromDocument(await fetchDidDocument(did), did);

export async function verifyTrackingToken(
  token: string,
  expectedDid: string,
  options: {
    now?: number;
    resolveKey?: SigningKeyResolver;
  } = {},
): Promise<void> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new ServiceAuthError(
      "malformed_token",
      "Invalid service token length",
    );
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new ServiceAuthError("malformed_token", "Malformed service token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseHeader(encodedHeader);
  const payload = parsePayload(encodedPayload);
  const now = options.now ?? Math.floor(Date.now() / 1000);

  if (payload.iss !== expectedDid) {
    throw new ServiceAuthError(
      "invalid_issuer",
      "Service token issuer does not match DID",
    );
  }
  if (payload.aud !== CHIVE_SERVICE_AUDIENCE) {
    throw new ServiceAuthError(
      "invalid_audience",
      "Service token audience does not match Chive",
    );
  }
  if (payload.lxm !== TRACK_USER_METHOD) {
    throw new ServiceAuthError(
      "invalid_method",
      "Service token method does not permit registration",
    );
  }
  if (
    payload.exp < now - CLOCK_SKEW_SECONDS ||
    payload.exp > now + MAX_TOKEN_LIFETIME_SECONDS + CLOCK_SKEW_SECONDS ||
    (payload.iat !== undefined &&
      (payload.iat > now + CLOCK_SKEW_SECONDS ||
        payload.iat < now - MAX_TOKEN_LIFETIME_SECONDS - CLOCK_SKEW_SECONDS ||
        payload.exp <= payload.iat))
  ) {
    throw new ServiceAuthError(
      "invalid_time",
      "Service token is outside its validity window",
    );
  }

  const signingInput = new TextEncoder().encode(
    `${encodedHeader}.${encodedPayload}`,
  );
  const signature = decodeBase64Url(encodedSignature);
  const getKey = options.resolveKey ?? resolveSigningKey;

  const verifyWithKey = async (forceRefresh: boolean): Promise<boolean> => {
    let key: string;
    try {
      key = await getKey(payload.iss, forceRefresh);
    } catch (cause) {
      throw new ServiceAuthError(
        "did_resolution_failed",
        "Could not resolve the service token issuer",
        { cause },
      );
    }

    try {
      return await verifySignature(key, signingInput, signature, {
        jwtAlg: header.alg,
        allowMalleableSig: true,
      });
    } catch (cause) {
      throw new ServiceAuthError(
        "invalid_signature",
        "Could not verify the service token signature",
        { cause },
      );
    }
  };

  if (!(await verifyWithKey(false)) && !(await verifyWithKey(true))) {
    throw new ServiceAuthError(
      "invalid_signature",
      "Service token signature is invalid",
    );
  }
}
