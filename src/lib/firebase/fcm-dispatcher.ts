import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccountKey | null {
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envKey) return null;

  try {
    if (envKey.trim().startsWith("{")) {
      return JSON.parse(envKey);
    }
    // Base64 encoded key handling
    const decoded = Buffer.from(envKey, "base64").toString("utf8");
    if (decoded.trim().startsWith("{")) {
      return JSON.parse(decoded);
    }
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
  }
  return null;
}

async function getGoogleAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedOAuthToken && cachedOAuthToken.expiresAt > now + 60) {
    return cachedOAuthToken.token;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsignedToken = `${encode(header)}.${encode(claimSet)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(serviceAccount.private_key, "base64url");
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth2 token exchange failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedOAuthToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in,
  };

  return data.access_token;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  data?: Record<string, string>;
}

export interface DispatchResult {
  success: boolean;
  totalTokens: number;
  successCount: number;
  failureCount: number;
  cleanedTokens: number;
  isMock: boolean;
  message: string;
}

export async function dispatchPushNotification(
  payload: PushNotificationPayload,
  targetTokens: string[]
): Promise<DispatchResult> {
  if (!targetTokens || targetTokens.length === 0) {
    return {
      success: true,
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      cleanedTokens: 0,
      isMock: false,
      message: "No registered device tokens found for target audience.",
    };
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not configured in .env. Live push skipped, recording in-app notification.");
    return {
      success: true,
      totalTokens: targetTokens.length,
      successCount: 0,
      failureCount: 0,
      cleanedTokens: 0,
      isMock: true,
      message: `Simulated push for ${targetTokens.length} devices (FIREBASE_SERVICE_ACCOUNT_KEY required in .env for live FCM delivery).`,
    };
  }

  let accessToken = "";
  try {
    accessToken = await getGoogleAccessToken(serviceAccount);
  } catch (err: any) {
    console.error("Failed to acquire FCM OAuth token:", err);
    return {
      success: false,
      totalTokens: targetTokens.length,
      successCount: 0,
      failureCount: targetTokens.length,
      cleanedTokens: 0,
      isMock: false,
      message: `FCM Authorization Error: ${err.message}`,
    };
  }

  const projectId = serviceAccount.project_id || "aervo-app";
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  // Concurrently dispatch in parallel batches of 25
  const batchSize = 25;
  for (let i = 0; i < targetTokens.length; i += batchSize) {
    const batch = targetTokens.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (token) => {
        try {
          const messageBody = {
            message: {
              token,
              notification: {
                title: payload.title,
                body: payload.body,
                ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
              },
              data: {
                title: payload.title,
                body: payload.body,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                ...(payload.deepLink ? { deep_link: payload.deepLink } : {}),
                ...(payload.imageUrl ? { image_url: payload.imageUrl } : {}),
                ...(payload.data || {}),
              },
              android: {
                priority: "HIGH",
                notification: {
                  channel_id: "high_importance_channel",
                  sound: "default",
                  default_sound: true,
                  default_vibrate_timings: true,
                  notification_priority: "PRIORITY_MAX",
                },
              },
            },
          };

          const res = await fetch(fcmEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messageBody),
          });

          if (res.ok) {
            successCount++;
          } else {
            failureCount++;
            const errorJson = await res.json().catch(() => ({}));
            const errorCode = errorJson?.error?.details?.[0]?.errorCode || errorJson?.error?.status;
            if (
              errorCode === "UNREGISTERED" ||
              errorCode === "INVALID_ARGUMENT" ||
              res.status === 404
            ) {
              invalidTokens.push(token);
            }
          }
        } catch (e) {
          failureCount++;
        }
      })
    );
  }

  // Prune invalid / expired tokens from database
  let cleanedTokens = 0;
  if (invalidTokens.length > 0) {
    try {
      const supabase = await createAdminClient();
      const { count } = await supabase
        .from("device_tokens")
        .delete({ count: "exact" })
        .in("fcm_token", invalidTokens);
      cleanedTokens = count || invalidTokens.length;
    } catch (cleanErr) {
      console.error("Error pruning invalid device tokens:", cleanErr);
    }
  }

  return {
    success: successCount > 0 || targetTokens.length === 0,
    totalTokens: targetTokens.length,
    successCount,
    failureCount,
    cleanedTokens,
    isMock: false,
    message: `Dispatched to ${successCount} devices via FCM (${failureCount} failed, ${cleanedTokens} stale tokens pruned).`,
  };
}
