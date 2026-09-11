import { NextResponse, type NextRequest } from "next/server";
import { dispatchAgentAssignmentAlert } from "@/lib/notifications/order-alert-service";
import { getOrderById } from "@/actions/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, agent_id, agent_phone, agent_name } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: "Missing required order_id" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const orderData = await getOrderById(order_id);

    if (!orderData) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    let resolvedAgent = null;
    if (agent_id || orderData.agent_id) {
      const targetId = agent_id || orderData.agent_id;
      const { data: agent } = await supabase
        .from("delivery_agents")
        .select("id, name, phone, status, vehicle_type, vehicle_number")
        .eq("id", targetId)
        .single();
      resolvedAgent = agent;
    }

    const phoneToUse = agent_phone || resolvedAgent?.phone;
    const nameToUse = agent_name || resolvedAgent?.name || "Delivery Partner";

    if (!phoneToUse) {
      return NextResponse.json(
        { success: false, error: "Agent phone number is required" },
        { status: 400 }
      );
    }

    const recipientName =
      orderData.delivery_address_details?.recipient_name ||
      orderData.profiles?.full_name ||
      "Valued Customer";
    const recipientPhone =
      orderData.delivery_address_details?.recipient_phone ||
      orderData.profiles?.phone_number ||
      "N/A";
    const deliveryAddress =
      orderData.delivery_address ||
      orderData.delivery_address_details?.full_address ||
      "Kakinada, Andhra Pradesh";
    const locationString =
      orderData.delivery_address_details?.location_string || deliveryAddress;
    const landmark = orderData.delivery_address_details?.landmark || "";

    const items = (orderData.order_items || []).map((it: any) => ({
      title: it.product_name || it.product?.name || "Item",
      name: it.product_name || it.product?.name || "Item",
      quantity: it.quantity || 1,
      price: it.unit_price,
      total_price: it.total_price,
      selected_prep_option: it.selected_prep_option,
      selected_extras: it.selected_extras,
    }));

    const result = await dispatchAgentAssignmentAlert({
      order_id: orderData.id,
      order_number: orderData.order_number || orderData.id.substring(0, 8).toUpperCase(),
      agent_name: nameToUse,
      agent_phone: phoneToUse,
      customer_name: recipientName,
      customer_phone: recipientPhone,
      total_amount: orderData.grand_total || orderData.total_amount || 0,
      payment_method: orderData.payment_method || "Cash on Delivery",
      payment_status: orderData.payment_status || "Pending",
      delivery_address: deliveryAddress,
      location_string: locationString,
      landmark: landmark,
      latitude: orderData.delivery_address_details?.latitude,
      longitude: orderData.delivery_address_details?.longitude,
      google_maps_url: orderData.delivery_address_details?.google_maps_url,
      delivery_otp: orderData.delivery_otp,
      delivery_notes: orderData.delivery_notes,
      delivery_slot: orderData.delivery_slot,
      items: items,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error in notify-agent API route:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testPhone = searchParams.get("phone") || "9030982289";
  const testAgentName = searchParams.get("name") || "Raju (Delivery)";

  const result = await dispatchAgentAssignmentAlert({
    order_id: "test-order-id",
    order_number: `KF-${Date.now().toString().slice(-4)}`,
    agent_name: testAgentName,
    agent_phone: testPhone,
    customer_name: "Srinivas Rao",
    customer_phone: "+919876543210",
    total_amount: 549.0,
    payment_method: "Cash on Delivery",
    payment_status: "Pending",
    delivery_address: "D.No 12-4-15, Main Road, Near Bhanugudi Junction, Kakinada, Andhra Pradesh - 533003",
    location_string: "Bhanugudi Junction, Kakinada",
    landmark: "Opposite SBI Bank",
    delivery_otp: "4829",
    delivery_notes: "Ring the doorbell on 2nd floor",
    delivery_slot: "15-Min Express Delivery",
    items: [
      {
        title: "Fresh Rohu Fish (Medium Curry Cut)",
        quantity: 1,
        price: 299,
        total_price: 299,
        selected_prep_option: { name: "Medium Curry Cut" },
      },
      {
        title: "Country Chicken (Curry Cut)",
        quantity: 1,
        price: 240,
        total_price: 240,
        selected_prep_option: { name: "Cleaned & Skinless" },
      },
    ],
  });

  return NextResponse.json({
    message: "Test delivery agent assignment alert processed",
    result,
  });
}
