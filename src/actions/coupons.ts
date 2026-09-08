"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request context
  }
}

export interface CouponPayload {
  code: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  min_order_value?: number;
  is_first_order?: boolean;
  is_active?: boolean;
  tag_text?: string;
}

export async function getCoupons() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching coupons:", error.message);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      code: c.code || c.coupon_code || "",
      title: c.title || c.name || "Discount Offer",
      description: c.description || "",
      discountPercentage: Number(c.discount_percentage || c.discount_pct || 0),
      discountAmount: Number(c.discount_amount || c.fixed_discount || 0),
      minOrderValue: Number(c.min_order_value || c.minOrderValue || 0),
      isFirstOrderOnly: Boolean(c.is_first_order ?? c.isFirstOrderOnly ?? false),
      isActive: Boolean(c.is_active ?? c.isActive ?? true),
      tagText: c.tag_text || c.tagText || "",
      createdAt: c.created_at || "",
    }));
  } catch (e: any) {
    console.error("Failed to load coupons:", e);
    return [];
  }
}

export async function createCoupon(data: CouponPayload) {
  try {
    const supabase = await createAdminClient();
    const cleanCode = data.code.trim().toUpperCase();

    if (!cleanCode) {
      return { success: false, error: "Coupon code is required." };
    }

    const payload = {
      code: cleanCode,
      coupon_code: cleanCode,
      title: data.title.trim() || cleanCode,
      description: data.description?.trim() || "Special promotional offer",
      discount_percentage: Number(data.discount_percentage || 0),
      discount_amount: Number(data.discount_amount || 0),
      min_order_value: Number(data.min_order_value || 0),
      is_first_order: Boolean(data.is_first_order),
      is_active: Boolean(data.is_active ?? true),
      tag_text: data.tag_text?.trim() || "",
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from("coupons")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating coupon:", error.message);
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/coupons");
    return { success: true, coupon: inserted };
  } catch (e: any) {
    console.error("Failed to create coupon:", e);
    return { success: false, error: e?.message || "Failed to create coupon." };
  }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/coupons");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to update coupon status." };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/coupons");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to delete coupon." };
  }
}
