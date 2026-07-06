"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:user_id (full_name, phone_number, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:user_id (full_name, phone_number, email),
      order_items (
        *,
        product:product_id (name, image_url, sku)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // If status is cancelled or refunded, we would typically trigger refund logic here.

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { success: true, data };
}
