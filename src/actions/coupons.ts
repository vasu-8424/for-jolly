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

    // Determine discount parameters for both schema styles
    const pct = Number(data.discount_percentage || 0);
    const amt = Number(data.discount_amount || 0);
    const discountType = pct > 0 ? "Percentage" : "Flat";
    const discountVal = pct > 0 ? pct : amt;
    const futureExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const fullPayload: Record<string, any> = {
      code: cleanCode,
      title: data.title.trim() || cleanCode,
      name: data.title.trim() || cleanCode,
      description: data.description?.trim() || "Special promotional offer",
      discount_type: discountType,
      discount_value: discountVal,
      discount_percentage: pct,
      discount_amount: amt,
      min_order_value: Number(data.min_order_value || 0),
      is_first_order: Boolean(data.is_first_order),
      is_active: Boolean(data.is_active ?? true),
      tag_text: data.tag_text?.trim() || "",
      expiry_date: futureExpiry,
      created_at: new Date().toISOString(),
    };

    // Attempt 1: Full Payload
    let { data: inserted, error } = await supabase
      .from("coupons")
      .insert([fullPayload])
      .select()
      .single();

    if (!error && inserted) {
      safeRevalidatePath("/marketing/coupons");
      return { success: true, coupon: inserted };
    }

    console.warn("Coupon full insert failed, trying schema variation 1:", error?.message);

    // Attempt 2: Standard migration schema
    const migrationPayload = {
      code: cleanCode,
      description: data.description?.trim() || "Special promotional offer",
      discount_type: discountType,
      discount_value: discountVal,
      min_order_value: Number(data.min_order_value || 0),
      expiry_date: futureExpiry,
      is_active: true,
    };

    const res2 = await supabase
      .from("coupons")
      .insert([migrationPayload])
      .select()
      .single();

    if (!res2.error && res2.data) {
      safeRevalidatePath("/marketing/coupons");
      return { success: true, coupon: res2.data };
    }

    console.warn("Coupon migration insert failed, trying schema variation 2:", res2.error?.message);

    // Attempt 3: Simple schema
    const simplePayload = {
      code: cleanCode,
      title: data.title.trim() || cleanCode,
      discount_percentage: pct,
      discount_amount: amt,
      min_order_value: Number(data.min_order_value || 0),
      is_active: true,
    };

    const res3 = await supabase
      .from("coupons")
      .insert([simplePayload])
      .select()
      .single();

    if (!res3.error && res3.data) {
      safeRevalidatePath("/marketing/coupons");
      return { success: true, coupon: res3.data };
    }

    // Attempt 4: Minimal payload (code, is_active)
    const minimalPayload = {
      code: cleanCode,
      is_active: true,
    };

    const res4 = await supabase
      .from("coupons")
      .insert([minimalPayload])
      .select()
      .single();

    if (!res4.error && res4.data) {
      safeRevalidatePath("/marketing/coupons");
      return { success: true, coupon: res4.data };
    }

    return { success: false, error: res4.error?.message || error?.message || "Failed to create coupon in Supabase." };
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
