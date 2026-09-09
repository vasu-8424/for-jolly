"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function isDummyPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const digits = phone.toString().replace(/\D/g, "");
  if (digits.length < 10) return true;
  // Detect placeholder phones like 9999999999, 0000000000, 1111111111, 1234567890
  if (/^(.)\1{7,}$/.test(digits) || digits === "1234567890") return true;
  return false;
}

export function formatOrderAddressData(order: any, fallbackAddress?: any) {
  const addr = order.addresses || fallbackAddress || null;

  // Extract structured address parts
  const houseFlat = addr?.house_flat || addr?.flat || addr?.house_no || "";
  const streetArea = addr?.street_area || addr?.street || addr?.area || addr?.address_line1 || "";
  const landmark = addr?.landmark ? `Near ${addr.landmark}` : "";
  const city = addr?.city || "Kakinada";
  const state = addr?.state || "Andhra Pradesh";
  const pincode = addr?.pincode || addr?.postal_code || "533001";

  // Address Type Tag (e.g. Home, Work, Other)
  const isLabel = ["home", "work", "office", "other", "default", "my address"].includes((addr?.name || "").toLowerCase().trim());
  const addressType = addr?.address_type || addr?.type || (isLabel ? addr.name : "Home");

  // User Profile
  const profileName = order.profiles?.full_name || order.profiles?.name || order.users?.full_name || "";
  const profilePhone = order.profiles?.phone_number || order.profiles?.phone || order.users?.phone || "";
  const profileEmail = order.profiles?.email || order.users?.email || "";

  // Recipient Name: Use profile name if address name is just a tag/label like "Home"
  const recipientName = (!isLabel && addr?.name?.trim()) ? addr.name.trim() : (profileName || "Valued Customer");

  // Recipient Phone: prioritize valid verified profile phone over dummy/placeholder phones like 9999999999
  let recipientPhone = profilePhone;
  if (addr?.phone && !isDummyPhone(addr.phone)) {
    recipientPhone = addr.phone;
  } else if (isDummyPhone(recipientPhone) && addr?.phone) {
    recipientPhone = addr.phone;
  }

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
    : (rawLocation || order.delivery_address || "Main Road, Kakinada, Andhra Pradesh - 533001");

  // Google Maps URL
  let googleMapsUrl: string | null = null;
  if (latitude && longitude && Number(latitude) !== 0 && Number(longitude) !== 0) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else if (formattedAddress && formattedAddress !== "No address provided") {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress.toLowerCase().includes("kakinada") ? formattedAddress : `${formattedAddress}, Kakinada, Andhra Pradesh`)}`;
  }

  // Compute exact financial breakdown
  const itemsList = Array.isArray(order.order_items) ? order.order_items : [];
  const itemsSubtotal = itemsList.length > 0
    ? itemsList.reduce((acc: number, it: any) => {
        const itemTotal = Number(it.total_price) || ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1));
        return acc + itemTotal;
      }, 0)
    : Number(order.subtotal ?? order.grand_total ?? order.total_amount ?? 0);

  // Free delivery threshold is > ₹499 (or if order.delivery_charge was recorded as 0)
  const isFreeDelivery = itemsSubtotal > 499 || Number(order.delivery_charge) === 0;
  const deliveryCharge = isFreeDelivery ? 0 : (Number(order.delivery_charge) > 0 ? Number(order.delivery_charge) : 40);
  const handlingFee = 10.0;
  const discountAmount = Number(order.discount_amount) || 0;
  const taxAmount = Number(order.tax_amount) || 0;

  // Stored grand total or calculated total
  const storedTotal = Number(order.grand_total ?? order.total_amount ?? 0);
  const calculatedTotal = itemsSubtotal + handlingFee + deliveryCharge - discountAmount;
  const finalGrandTotal = storedTotal > 0 ? storedTotal : calculatedTotal;

  // Invoice Number
  const invoiceNumber = order.invoice_number || `INV-${order.id ? order.id.substring(0, 8).toUpperCase() : Date.now().toString().slice(-6)}`;

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
      recipient_email: profileEmail,
      full_address: formattedAddress,
      location_string: rawLocation || formattedAddress,
      latitude: latitude,
      longitude: longitude,
      google_maps_url: googleMapsUrl,
    },
    invoice_number: invoiceNumber,
    items_subtotal: itemsSubtotal,
    delivery_charge: deliveryCharge,
    is_free_delivery: isFreeDelivery,
    handling_fee: handlingFee,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    subtotal: itemsSubtotal,
    total_amount: finalGrandTotal,
    grand_total: finalGrandTotal,
  };
}

export async function getOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:users!user_id (full_name, phone_number:phone, email),
      addresses:address_id (*),
      delivery_agents:agent_id (id, name, phone, email, vehicle_type, vehicle_number, status),
      order_items (
        *,
        product:product_id (name, sku, mrp, selling_price, brand, unit)
      )
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
  if (!id) return null;

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  let order: any = null;

  if (isUuid) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:users!user_id (full_name, phone_number:phone, email),
        addresses:address_id (*),
        delivery_agents:agent_id (id, name, phone, email, vehicle_type, vehicle_number, status),
        order_items (
          *,
          product:product_id (name, sku, mrp, selling_price, brand, unit)
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      order = data;
    }
  }

  // Fallback by order_number or partial ID match
  if (!order) {
    const { data: byOrdNo } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:users!user_id (full_name, phone_number:phone, email),
        addresses:address_id (*),
        delivery_agents:agent_id (id, name, phone, email, vehicle_type, vehicle_number, status),
        order_items (
          *,
          product:product_id (name, sku, mrp, selling_price, brand, unit)
        )
      `)
      .or(`order_number.eq.${id},invoice_number.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (byOrdNo) {
      order = byOrdNo;
    }
  }

  if (!order) {
    console.error("Error fetching order by ID:", id);
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
  revalidatePath(`/invoice/${id}`);
  return { success: true, data };
}

export async function verifyAndDeliverOrder(id: string, otp: string) {
  const supabase = await createAdminClient();
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("delivery_otp, id, delivery_notes")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return updateOrderStatus(id, "Delivered");
  }

  // Extract OTP from delivery_otp or delivery_notes
  let expectedOtp = order.delivery_otp?.toString()?.trim();
  if (!expectedOtp && order.delivery_notes) {
    const match = order.delivery_notes.match(/(\d{4})/);
    if (match) expectedOtp = match[1];
  }

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
  revalidatePath(`/invoice/${id}`);
  return { success: true, data };
}
