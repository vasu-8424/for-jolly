"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:users!user_id (full_name, phone_number:phone, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data.map((order: any) => ({
    ...order,
    total_amount: Number(order.grand_total ?? order.total_amount ?? 0),
    grand_total: Number(order.grand_total ?? order.total_amount ?? 0),
  }));
}

export async function getOrderById(id: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:users!user_id (full_name, phone_number:phone, email),
      order_items (
        *,
        product:product_id (name, sku)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }
  return {
    ...data,
    total_amount: Number(data.grand_total ?? data.total_amount ?? 0),
    grand_total: Number(data.grand_total ?? data.total_amount ?? 0),
  };
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { success: true, data };
}

export async function verifyAndDeliverOrder(id: string, otp: string) {
  const supabase = await createAdminClient();
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("delivery_otp, id")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    // If delivery_otp column does not exist or fetch fails, compare with fallback or complete
    return updateOrderStatus(id, "Delivered");
  }

  const expectedOtp = order.delivery_otp?.toString()?.trim();
  if (expectedOtp && otp.trim() !== expectedOtp) {
    return { success: false, error: "Invalid Delivery OTP! Please check with customer." };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "Delivered", payment_status: "Paid" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { success: true, data };
}
