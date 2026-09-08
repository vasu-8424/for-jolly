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

    // 1. Insert In-App Broadcast Notification into Supabase notifications table
    const payload = {
      user_id: null, // Broadcast to all registered users
      title: data.title.trim(),
      message: data.body.trim(),
      deep_link: data.deep_link?.trim() || null,
      image_url: data.image_url?.trim() || null,
      type: "Promo",
      status: "Sent",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    let notification: any = null;
    const { data: inserted, error: insertError } = await supabase
      .from("notifications")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase notification insert info:", insertError.message);
      try {
        const { data: fallbackInserted } = await supabase
          .from("notifications")
          .insert([{
            title: data.title.trim(),
            message: data.body.trim(),
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();
        notification = fallbackInserted;
      } catch (_) {}
    } else {
      notification = inserted;
    }

    // 2. Fetch Device Tokens from users table AND device_tokens table
    const targetTokens = new Set<string>();

    try {
      const { data: usersData } = await supabase
        .from("users")
        .select("fcm_token")
        .not("fcm_token", "is", null);

      if (usersData) {
        usersData.forEach((u: any) => {
          if (u.fcm_token && typeof u.fcm_token === "string" && u.fcm_token.trim()) {
            targetTokens.add(u.fcm_token.trim());
          }
        });
      }
    } catch (uErr: any) {
      console.warn("Notice querying users fcm_token:", uErr.message);
    }

    try {
      let tokenQuery = supabase.from("device_tokens").select("fcm_token");
      if (data.target_audience === "active") {
        tokenQuery = tokenQuery.not("user_id", "is", null);
      }
      const { data: tokensData } = await tokenQuery;
      if (tokensData) {
        tokensData.forEach((t: any) => {
          if (t.fcm_token && typeof t.fcm_token === "string" && t.fcm_token.trim()) {
            targetTokens.add(t.fcm_token.trim());
          }
        });
      }
    } catch (_) {}

    const tokenList = Array.from(targetTokens);

    // 3. Dispatch Push Notifications via FCM HTTP v1
    const fcmResult = await dispatchPushNotification(
      {
        title: data.title.trim(),
        body: data.body.trim(),
        imageUrl: data.image_url?.trim() || null,
        deepLink: data.deep_link?.trim() || null,
      },
      tokenList
    );

    safeRevalidatePath("/notifications");

    return {
      success: true,
      notification,
      fcm: fcmResult,
      message: `Broadcast saved & dispatched to ${tokenList.length > 0 ? tokenList.length + " registered device(s)" : "all customer app inboxes"}!`,
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
