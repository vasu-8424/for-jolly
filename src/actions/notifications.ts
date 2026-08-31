"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function sendBroadcastNotification(data: {
  title: string;
  body: string;
  deep_link?: string;
  target_audience?: string;
  image_url?: string;
}) {
  try {
    const supabase = await createAdminClient();

    const payload = {
      title: data.title.trim(),
      message: data.body.trim(),
      deep_link: data.deep_link?.trim() || null,
      image_url: data.image_url?.trim() || null,
      type: "Promo",
      status: "Sent",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase notification insert error:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    revalidatePath("/notifications");
    return { 
      success: true, 
      notification, 
      message: "Push notification broadcast dispatched successfully to all app users!" 
    };
  } catch (e: any) {
    console.error("Failed to send broadcast notification:", e);
    return { 
      success: false, 
      error: e?.message || "Failed to dispatch notification." 
    };
  }
}

export async function getNotifications() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
}
