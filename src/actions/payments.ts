"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getPayments() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        orders ( order_number ),
        users:customer_id ( full_name, phone )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getPayments:", err);
    return [];
  }
}

export async function initiateRefundAction(paymentId: string, amount: number, reason: string) {
  try {
    const supabase = await createAdminClient();

    const { data: payment, error: fetchErr } = await supabase
      .from("payments")
      .select("order_id, amount")
      .eq("id", paymentId)
      .single();

    if (fetchErr || !payment) {
      return { success: false, error: "Payment record not found." };
    }

    const { error: refundErr } = await supabase.from("refunds").insert({
      payment_id: paymentId,
      order_id: payment.order_id,
      refund_amount: amount || payment.amount,
      reason: reason || "Admin initiated refund",
      refund_status: "Pending",
    });

    if (refundErr) {
      return { success: false, error: refundErr.message };
    }

    await supabase
      .from("payments")
      .update({ status: "Refunded" })
      .eq("id", paymentId);

    revalidatePath("/payments");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to initiate refund." };
  }
}
