"use server";

import { createClient } from "@/lib/supabase/server";

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) return { products: [], customers: [], orders: [] };

  const supabase = await createClient();
  const searchStr = `%${query.trim()}%`;

  // Search Products
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .ilike("name", searchStr)
    .limit(5);

  // Search Customers
  const { data: customers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .or(`full_name.ilike.${searchStr},email.ilike.${searchStr}`)
    .limit(5);

  // Search Orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status")
    .ilike("id", searchStr)
    .limit(5);

  return {
    products: products || [],
    customers: customers || [],
    orders: orders || [],
  };
}
