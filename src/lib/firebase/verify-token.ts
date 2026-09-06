import crypto from "crypto";

interface JwkKey {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
}

let cachedJwks: { keys: JwkKey[]; expiresAt: number } | null = null;

async function getGoogleJwks(): Promise<JwkKey[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }

  try {
    const res = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google JWKS: ${res.statusText}`);
    }
    const data = await res.json();
    cachedJwks = {
      keys: data.keys || [],
      expiresAt: now + 3600 * 1000,
    };
    return cachedJwks.keys;
  } catch (err) {
    console.error("Error fetching Google JWKS:", err);
    return cachedJwks?.keys || [];
  }
}

function base64UrlToBuffer(b64url: string): Buffer {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }
  return Buffer.from(b64, "base64");
}

function jwkToPem(jwk: JwkKey): string {
  const nBuffer = base64UrlToBuffer(jwk.n);
  const eBuffer = base64UrlToBuffer(jwk.e);

  const keyObject = crypto.createPublicKey({
    key: {
      kty: "RSA",
      n: jwk.n,
      e: jwk.e,
    },
    format: "jwk",
  });

  return keyObject.export({ format: "pem", type: "spki" }) as string;
}

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId = "aervo-app"
): Promise<{ valid: boolean; uid?: string; error?: string }> {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed JWT token structure" };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlToBuffer(headerB64).toString("utf8"));
    const payload = JSON.parse(base64UrlToBuffer(payloadB64).toString("utf8"));

    if (header.alg !== "RS256" || !header.kid) {
      return { valid: false, error: "Invalid header algorithm or missing kid" };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return { valid: false, error: "Firebase ID token has expired" };
    }

    if (payload.aud !== projectId) {
      return { valid: false, error: `Audience mismatch: expected ${projectId}, got ${payload.aud}` };
    }

    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIssuer) {
      return { valid: false, error: `Issuer mismatch: expected ${expectedIssuer}, got ${payload.iss}` };
    }

    const keys = await getGoogleJwks();
    const matchingKey = keys.find((k) => k.kid === header.kid);
    if (!matchingKey) {
      return { valid: false, error: "No matching public key found for kid" };
    }

    const pem = jwkToPem(matchingKey);
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    const signatureBuffer = base64UrlToBuffer(signatureB64);

    const isValid = verifier.verify(pem, signatureBuffer);
    if (!isValid) {
      return { valid: false, error: "Cryptographic signature verification failed" };
    }

    const uid = payload.user_id || payload.sub;
    if (!uid) {
      return { valid: false, error: "Missing uid in verified token payload" };
    }

    return { valid: true, uid };
  } catch (err: any) {
    console.error("Firebase ID token verification error:", err);
    return { valid: false, error: err?.message || "Token verification failed" };
  }
}
