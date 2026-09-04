import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { dispatchOrderAlert } from "@/lib/notifications/order-alert-service";

let isListening = false;
const processedOrders = new Set<string>();

export function initRealtimeOrderListener() {
  if (isListening) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://imjlkcvozqekepsvxpvt.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltamxrY3ZvenFla2Vwc3Z4cHZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3NDEwMCwiZXhwIjoyMDk4NzUwMTAwfQ.xJS5toJZ5Vd_mWyi4G7EDi3O2GW1zqUFnpUvPiegQSc";

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: WebSocket,
    },
  });

  const channel = supabase
    .channel("server-realtime-orders-listener")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      async (payload) => {
        const orderId = payload.new.id;
        const orderNumber = payload.new.order_number || orderId;

        if (processedOrders.has(orderId)) {
          console.log(`[Order Listener] Order ${orderNumber} already processed, skipping duplicate.`);
          return;
        }
        processedOrders.add(orderId);

        // Keep set size reasonable
        if (processedOrders.size > 500) {
          const firstKey = processedOrders.values().next().value;
          if (firstKey) processedOrders.delete(firstKey);
        }

        console.log(`[Order Listener] 🚨 Detected NEW ORDER in Supabase: #${orderNumber}`);

        // Wait 1.5 seconds to allow Flutter to finish inserting child order_items
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
          // Fetch full order details including joined items, user, and address
          const { data: orderData, error: fetchErr } = await supabase
            .from("orders")
            .select(`
              *,
              order_items(*),
              users:user_id(id, full_name, phone, email),
              addresses:address_id(*)
            `)
            .eq("id", orderId)
            .maybeSingle();

          if (fetchErr) {
            console.error(`[Order Listener] Error fetching order ${orderId}:`, fetchErr);
          }

          const o = orderData || payload.new;
          const userObj = o.users || {};
          const addrObj = o.addresses || {};

          // Resolve clean delivery address
          let resolvedAddress =
            [addrObj.house_flat, addrObj.street_area, addrObj.landmark, addrObj.city, addrObj.pincode]
              .filter(Boolean)
              .join(", ") ||
            o.delivery_address ||
            addrObj.address_line ||
            "Kakinada, Andhra Pradesh";

          if (!resolvedAddress.toLowerCase().includes("kakinada")) {
            resolvedAddress += ", Kakinada, AP";
          }

          // Generate Google Maps navigation link
          const searchAddress = resolvedAddress;
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;

          // Format items
          const itemsRaw = o.order_items || [];
          const formattedItems = itemsRaw.map((it: any) => ({
            title: it.product_name || "Item",
            quantity: Number(it.quantity) || 1,
            price: Number(it.unit_price) || 0,
            total_price: Number(it.total_price) || (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
            selected_prep_option: it.selected_prep_option,
            selected_extras: it.selected_extras,
          }));

          const customerName = userObj.full_name || addrObj.name || o.customer_name || "Customer";
          const customerPhone = userObj.phone || addrObj.phone || o.customer_phone || "N/A";
          const customerEmail = userObj.email || o.customer_email || "N/A";
          const totalAmount = Number(o.grand_total || o.subtotal || o.total_amount || 0);

          console.log(`[Order Listener] Dispatched alert for order #${orderNumber} (${customerName}, ${customerPhone})`);

          await dispatchOrderAlert({
            order_id: orderId,
            order_number: orderNumber,
            total_amount: totalAmount,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            payment_method: o.payment_method || "Cash on Delivery",
            delivery_address: resolvedAddress,
            delivery_slot: o.delivery_slot || "15-Min Express Delivery",
            delivery_otp: o.delivery_otp || "N/A",
            google_maps_url: googleMapsUrl,
            items: formattedItems,
            owner_phone: process.env.OWNER_PHONE || "9030982289",
          });
        } catch (err: any) {
          console.error(`[Order Listener] Error processing order ${orderNumber}:`, err);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Order Listener] Realtime subscription status: ${status}`);
      if (status === "SUBSCRIBED") {
        isListening = true;
      }
    });
}
