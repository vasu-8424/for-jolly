import { NextResponse, type NextRequest } from "next/server";
import { dispatchOrderAlert } from "@/lib/notifications/order-alert-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      order_number,
      total_amount,
      customer_name,
      customer_phone,
      customer_email,
      payment_method,
      delivery_address,
      delivery_slot,
      delivery_otp,
      google_maps_url,
      items,
      owner_phone = "9030982289",
    } = body;

    if (!order_number) {
      return NextResponse.json(
        { success: false, error: "Missing required order_number" },
        { status: 400 }
      );
    }

    const result = await dispatchOrderAlert({
      order_id,
      order_number: String(order_number),
      total_amount: total_amount || 0,
      customer_name: customer_name || "Customer",
      customer_phone: customer_phone || "N/A",
      customer_email,
      payment_method: payment_method || "Cash on Delivery",
      delivery_address: delivery_address || "Kakinada, Andhra Pradesh",
      delivery_slot: delivery_slot || "15-Min Express Delivery",
      delivery_otp: delivery_otp || "N/A",
      google_maps_url,
      items: items || [],
      owner_phone: String(owner_phone || "9030982289"),
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error in notify-order API route:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testPhone = searchParams.get("phone") || "9030982289";

  const result = await dispatchOrderAlert({
    order_number: `TEST-${Date.now().toString().slice(-4)}`,
    total_amount: 499.0,
    customer_name: "Test Customer",
    customer_phone: "+919876543210",
    payment_method: "Cash on Delivery",
    delivery_address: "Bhanugudi Junction, Kakinada, Andhra Pradesh",
    delivery_slot: "15-Min Express Delivery",
    delivery_otp: "7842",
    items: [
      { title: "Fresh Rohu Fish (Medium Curry Cut)", quantity: 1, price: 299 },
      { title: "Organic Country Eggs", quantity: 2, price: 100 },
    ],
    owner_phone: testPhone,
  });

  return NextResponse.json({
    message: "Test order alert processed",
    result,
  });
}
