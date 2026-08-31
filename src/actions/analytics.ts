"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboardMetrics() {
  const supabase = await createAdminClient();
  
  // Get active customers count
  const { count: customersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get total orders count
  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  // Get total revenue (sum of all delivered orders)
  const { data: deliveredOrders } = await supabase
    .from("orders")
    .select("grand_total")
    .eq("status", "Delivered");

  const totalRevenue = deliveredOrders?.reduce((acc, order) => acc + Number(order.grand_total || 0), 0) || 0;

  // Pending orders
  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  return {
    revenue: totalRevenue,
    orders: ordersCount || 0,
    customers: customersCount || 0,
    pending: pendingCount || 0,
  };
}
