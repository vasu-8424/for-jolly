"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  const supabase = await createAdminClient();
  // Fetch from users table which has wallet_balance and reward_points
  const { data, error } = await supabase
    .from("users")
    .select(`
      *
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  // Map to format expected by UI
  return data.map((user: any) => ({
    ...user,
    wallets: [{
      balance: user.wallet_balance || 0,
      reward_points: user.reward_points || 0
    }]
  }));
}

export async function getCustomerById(id: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      addresses (*),
      orders (id, grand_total, status, created_at)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching customer details:", error);
    return null;
  }

  // Map wallets to balance and reward points from users table and format orders
  return {
    ...data,
    orders: (data.orders || []).map((ord: any) => ({
      ...ord,
      total_amount: Number(ord.grand_total || 0),
    })),
    wallets: [{
      balance: data.wallet_balance || 0,
      reward_points: data.reward_points || 0
    }]
  };
}

export async function addWalletCredit(customerId: string, amount: number, reason: string) {
  const supabase = await createAdminClient();
  
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", customerId)
    .single();
  
  if (fetchError || !user) return { success: false, error: "Customer not found" };

  const newBalance = Number(user.wallet_balance) + amount;

  const { error: updateError } = await supabase
    .from("users")
    .update({ wallet_balance: newBalance })
    .eq("id", customerId);

  if (updateError) return { success: false, error: updateError.message };

  await supabase.from("wallet_transactions").insert([{
    user_id: customerId,
    transaction_type: 'Credit',
    amount: amount,
    description: reason
  }]);

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}

export async function updateCustomer(id: string, updates: any) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}
