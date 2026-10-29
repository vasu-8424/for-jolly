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

function formatOrderAddressData(order: any, fallbackAddress?: any) {
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

  // Exact GPS Coordinates extraction & validation
  const rawLat = order.delivery_latitude ?? order.latitude ?? addr?.latitude ?? order.delivery_lat ?? addr?.lat ?? null;
  const rawLng = order.delivery_longitude ?? order.longitude ?? addr?.longitude ?? order.delivery_lng ?? addr?.lng ?? null;

  const numLat = rawLat !== null && rawLat !== undefined && rawLat !== "" ? Number(rawLat) : null;
  const numLng = rawLng !== null && rawLng !== undefined && rawLng !== "" ? Number(rawLng) : null;

  const hasExactCoordinates =
    numLat !== null &&
    numLng !== null &&
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180 &&
    (numLat !== 0 || numLng !== 0);

  const accuracy = order.delivery_location_accuracy !== null && order.delivery_location_accuracy !== undefined
    ? Number(order.delivery_location_accuracy)
    : null;

  const finalLandmark = (order.delivery_landmark || addr?.landmark || landmark || "").trim();

  // Snapshot address recorded directly at checkout (e.g. Hyderabad, or pinned location)
  const snapshotAddr = (order.delivery_address_text || order.delivery_address || "").trim();

  // Structured address parts fallback
  const parts: string[] = [];
  if (houseFlat) parts.push(houseFlat);
  if (streetArea && streetArea !== houseFlat) parts.push(streetArea);
  if (finalLandmark && !houseFlat.includes(finalLandmark)) {
    parts.push(finalLandmark.startsWith("Near ") ? finalLandmark : `Near ${finalLandmark}`);
  }
  if (city && !houseFlat.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (state && pincode && !houseFlat.includes(pincode)) {
    parts.push(`${state} - ${pincode}`);
  } else if (pincode && !houseFlat.includes(pincode)) {
    parts.push(pincode);
  }

  // ORDER SNAPSHOT ADDRESS IS KING:
  // If order was placed to Hyderabad or a specific pinned location, NEVER override it with joined addresses table!
  const formattedAddress = snapshotAddr.length > 0 && snapshotAddr !== "No address provided"
    ? snapshotAddr
    : (parts.length > 0 ? parts.join(", ") : (addr?.full_address || "Main Road, Kakinada, Andhra Pradesh - 533001"));

  const rawLocation = formattedAddress;

  // Google Maps Driving Navigation & Search Pin URLs
  let navigationUrl: string | null = null;
  let googleMapsUrl: string | null = null;

  if (hasExactCoordinates) {
    navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`;
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`;
  } else if (formattedAddress && formattedAddress !== "No address provided") {
    const searchAddress = formattedAddress.toLowerCase().includes("kakinada")
      ? formattedAddress
      : `${formattedAddress}, Kakinada, Andhra Pradesh`;
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;
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
  const isFreeDelivery = itemsSubtotal > 299 || Number(order.delivery_charge) === 0;
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

  // Payment status resolution
  const isCod = (order.payment_method || "").toLowerCase().includes("cod") || (order.payment_method || "").toLowerCase().includes("cash");
  const isPaid = (order.payment_status || "").toLowerCase() === "paid" || (!isCod && order.payment_method);
  const resolvedPaymentStatus = isPaid ? "Paid" : (order.payment_status || "Pending");
  const resolvedPaymentMethod = order.payment_method || (isCod ? "Cash on Delivery" : "Online Payment (Razorpay)");

  return {
    ...order,
    payment_status: resolvedPaymentStatus,
    payment_method: resolvedPaymentMethod,
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
      latitude: hasExactCoordinates ? numLat : null,
      longitude: hasExactCoordinates ? numLng : null,
      accuracy: accuracy,
      has_exact_coordinates: hasExactCoordinates,
      navigation_url: navigationUrl,
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
