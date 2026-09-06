"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { dispatchPushNotification } from "@/lib/firebase/fcm-dispatcher";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request context
  }
}

export async function sendBroadcastNotification(data: {
  title: string;
  body: string;
  deep_link?: string;
  target_audience?: string;
  image_url?: string;
}) {
  try {
    const supabase = await createAdminClient();

    // 1. Insert In-App Broadcast Notification
    const payload = {
      user_id: null, // Broadcast to all users
      title: data.title.trim(),
      message: data.body.trim(),
      deep_link: data.deep_link?.trim() || null,
      image_url: data.image_url?.trim() || null,
      type: "Promo",
      status: "Sent",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase notification insert error:", insertError);
      return {
        success: false,
        error: insertError.message,
      };
    }

    // 2. Fetch Device Tokens
    let tokenQuery = supabase.from("device_tokens").select("fcm_token");
    if (data.target_audience === "active") {
      tokenQuery = tokenQuery.not("user_id", "is", null);
    }

    const { data: tokensData, error: tokenError } = await tokenQuery;
    if (tokenError) {
      console.warn("Could not query device_tokens (table might be empty or initializing):", tokenError.message);
    }

    const targetTokens = (tokensData || []).map((t: any) => t.fcm_token).filter(Boolean);

    // 3. Dispatch Push Notifications via Google FCM HTTP v1
    const fcmResult = await dispatchPushNotification(
      {
        title: data.title.trim(),
        body: data.body.trim(),
        imageUrl: data.image_url?.trim() || null,
        deepLink: data.deep_link?.trim() || null,
      },
      targetTokens
    );

    safeRevalidatePath("/notifications");

    return {
      success: true,
      notification,
      fcm: fcmResult,
      message: fcmResult.isMock
        ? `Broadcast saved to customer inbox. (FCM private key needed for live background push).`
        : `Broadcast dispatched! ${fcmResult.message}`,
    };
  } catch (e: any) {
    console.error("Failed to send broadcast notification:", e);
    return {
      success: false,
      error: e?.message || "Failed to dispatch notification.",
    };
  }
}

export async function getNotifications() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
}

export async function getDeviceTokensStats() {
  try {
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("device_tokens")
      .select("*", { count: "exact", head: true });

    if (error) return { totalDevices: 0 };
    return { totalDevices: count || 0 };
  } catch {
    return { totalDevices: 0 };
  }
}
