"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  const supabase = await createClient();
  // Profiles is the main table representing customers based on Supabase Auth.
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      wallets (balance, reward_points)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
  return data;
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      wallets (*),
      addresses (*),
      orders (id, total_amount, status, created_at)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching customer details:", error);
    return null;
  }
  return data;
}

// Admin action to instantly add credit to customer wallet
export async function addWalletCredit(customerId: string, amount: number, reason: string) {
  const supabase = await createClient();
  
  // Real implementation would use an RPC call or trigger to ensure atomic increments
  // For now, we'll fetch current, update, and insert transaction.
  const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", customerId).single();
  
  if (!wallet) return { success: false, error: "Wallet not found" };

  const newBalance = Number(wallet.balance) + amount;

  const { error: updateError } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", wallet.id);

  if (updateError) return { success: false, error: updateError.message };

  await supabase.from("wallet_transactions").insert([{
    wallet_id: wallet.id,
    type: 'credit',
    amount: amount,
    description: reason
  }]);

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}

export async function updateCustomer(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}
