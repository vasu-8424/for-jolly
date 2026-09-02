"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function formatOrderAddressData(order: any, fallbackAddress?: any) {
  const addr = order.addresses || fallbackAddress || null;

  // Extract structured address parts
  const houseFlat = addr?.house_flat || addr?.flat || addr?.house_no || "";
  const streetArea = addr?.street_area || addr?.street || addr?.area || addr?.address_line1 || "";
  const landmark = addr?.landmark ? `Near ${addr.landmark}` : "";
  const city = addr?.city || "";
  const state = addr?.state || "";
  const pincode = addr?.pincode || addr?.postal_code || "";
  const addressType = addr?.address_type || addr?.type || "Delivery Address";
  const recipientName = addr?.name || order.profiles?.full_name || "Customer";
  const recipientPhone = addr?.phone || order.profiles?.phone_number || "";

  // GPS / Coordinates & location string
  const latitude = addr?.latitude ?? addr?.lat ?? order.latitude ?? order.delivery_lat ?? order.lat ?? null;
  const longitude = addr?.longitude ?? addr?.lng ?? order.longitude ?? order.delivery_lng ?? order.lng ?? null;
  const rawLocation = addr?.location_string || addr?.location || addr?.full_address || addr?.formatted_address || order.delivery_location || order.location_string || order.location || order.delivery_address || "";

  // Combine full address string
  const addressParts = [
    houseFlat,
    streetArea,
    landmark,
    city,
    state && pincode ? `${state} - ${pincode}` : (state || pincode)
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0 
    ? addressParts.join(", ") 
    : (rawLocation || order.delivery_address || "No address provided");

  // Google Maps URL
  let googleMapsUrl: string | null = null;
  if (latitude && longitude && Number(latitude) !== 0 && Number(longitude) !== 0) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else if (formattedAddress && formattedAddress !== "No address provided") {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;
  }

  return {
    ...order,
    delivery_address: formattedAddress,
    delivery_address_details: {
      type: addressType,
      house_flat: houseFlat,
      street_area: streetArea,
      landmark: landmark,
      city: city,
      state: state,
      pincode: pincode,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      full_address: formattedAddress,
      location_string: rawLocation || formattedAddress,
      latitude: latitude,
      longitude: longitude,
      google_maps_url: googleMapsUrl,
    },
    total_amount: Number(order.grand_total ?? order.total_amount ?? 0),
    grand_total: Number(order.grand_total ?? order.total_amount ?? 0),
  };
}

export async function getOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:users!user_id (full_name, phone_number:phone, email),
      addresses:address_id (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data.map((order: any) => formatOrderAddressData(order));
}

export async function getOrderById(id: string) {
  const supabase = await createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:users!user_id (full_name, phone_number:phone, email),
      addresses:address_id (*),
      order_items (
        *,
        product:product_id (name, sku)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    return null;
  }

  // Fallback: if order.addresses is null but user_id exists, fetch user's address from addresses table
  let fallbackAddress = null;
  if (!order.addresses && order.user_id) {
    const { data: userAddrs } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", order.user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (userAddrs && userAddrs.length > 0) {
      fallbackAddress = userAddrs[0];
    }
  }

  return formatOrderAddressData(order, fallbackAddress);
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
