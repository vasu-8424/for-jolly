"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  vehicle_type: string; // 'bike', 'scooter', 'cycle', 'other'
  vehicle_number?: string | null;
  status: string; // 'active', 'inactive'
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  // Computed runtime properties
  current_order_id?: string | null;
  current_order_number?: string | null;
  current_order_status?: string | null;
  is_available: boolean;
  is_on_delivery: boolean;
}

export interface CreateDeliveryAgentInput {
  name: string;
  phone: string;
  email?: string;
  vehicleType: string;
  vehicleNumber?: string;
  status?: string;
}

export interface UpdateDeliveryAgentInput {
  name?: string;
  phone?: string;
  email?: string | null;
  vehicleType?: string;
  vehicleNumber?: string | null;
  status?: string;
}

export async function getDeliveryAgents(): Promise<DeliveryAgent[]> {
  const supabase = await createAdminClient();

  // 1. Fetch all delivery agents
  const { data: agents, error: agentsErr } = await supabase
    .from("delivery_agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (agentsErr) {
    console.error("Error fetching delivery agents:", agentsErr);
    return [];
  }

  // 2. Fetch all active orders that have an assigned agent
  const { data: activeOrders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, order_number, status, agent_id")
    .not("agent_id", "is", null)
    .not("status", "in", '("Delivered","Cancelled","Returned","Refunded")');

  if (ordersErr) {
    console.error("Error fetching active orders for agents:", ordersErr);
  }

  const activeOrderMap: Record<string, { id: string; order_number: string; status: string }> = {};
  if (activeOrders) {
    for (const ord of activeOrders) {
      if (ord.agent_id) {
        activeOrderMap[ord.agent_id] = ord;
      }
    }
  }

  // 3. Map agents with their live delivery status
  return (agents || []).map((agent: any) => {
    const activeOrder = activeOrderMap[agent.id];
    const isBusy = !!activeOrder;
    const isActive = (agent.status || "active").toLowerCase() === "active";

    return {
      ...agent,
      current_order_id: activeOrder?.id || null,
      current_order_number: activeOrder?.order_number || null,
      current_order_status: activeOrder?.status || null,
      is_available: isActive && !isBusy,
      is_on_delivery: isActive && isBusy,
    };
  });
}

export async function getDeliveryAgentById(id: string): Promise<DeliveryAgent | null> {
  const supabase = await createAdminClient();

  const { data: agent, error } = await supabase
    .from("delivery_agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !agent) {
    console.error("Error fetching delivery agent by id:", error);
    return null;
  }

  // Check if agent currently has an active order
  const { data: activeOrder } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("agent_id", id)
    .not("status", "in", '("Delivered","Cancelled","Returned","Refunded")')
    .limit(1)
    .maybeSingle();

  const isBusy = !!activeOrder;
  const isActive = (agent.status || "active").toLowerCase() === "active";

  return {
    ...agent,
    current_order_id: activeOrder?.id || null,
    current_order_number: activeOrder?.order_number || null,
    current_order_status: activeOrder?.status || null,
    is_available: isActive && !isBusy,
    is_on_delivery: isActive && isBusy,
  };
}

export async function createDeliveryAgent(input: CreateDeliveryAgentInput) {
  const supabase = await createAdminClient();

  const payload: any = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    vehicle_type: input.vehicleType || "bike",
    vehicle_number: input.vehicleNumber?.trim() || null,
    status: input.status || "active",
  };

  const { data, error } = await supabase
    .from("delivery_agents")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      throw new Error("A delivery agent with this phone number already exists.");
    }
    throw new Error(error.message || "Failed to create delivery agent.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  return { success: true, data };
}

export async function updateDeliveryAgent(id: string, updates: UpdateDeliveryAgentInput) {
  const supabase = await createAdminClient();

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.phone !== undefined) payload.phone = updates.phone.trim();
  if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
  if (updates.vehicleType !== undefined) payload.vehicle_type = updates.vehicleType;
  if (updates.vehicleNumber !== undefined) payload.vehicle_number = updates.vehicleNumber?.trim() || null;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase
    .from("delivery_agents")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate key")) {
      throw new Error("Another delivery agent with this phone number already exists.");
    }
    throw new Error(error.message || "Failed to update delivery agent.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  return { success: true, data };
}

export async function setAgentStatus(id: string, status: "active" | "inactive") {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("delivery_agents")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update agent status.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  return { success: true, data };
}

export async function deleteDeliveryAgent(id: string) {
  const supabase = await createAdminClient();

  // Guard against deleting an agent who has an active delivery in progress
  const { data: activeOrder } = await supabase
    .from("orders")
    .select("order_number")
    .eq("agent_id", id)
    .not("status", "in", '("Delivered","Cancelled","Returned","Refunded")')
    .limit(1)
    .maybeSingle();

  if (activeOrder) {
    throw new Error(
      `Cannot delete this agent because they are currently assigned to active order ${activeOrder.order_number}. Please reassign or complete that order first.`
    );
  }

  const { error } = await supabase
    .from("delivery_agents")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to delete delivery agent.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  return { success: true };
}

export async function assignAgentToOrder(orderId: string, agentId: string) {
  const supabase = await createAdminClient();

  // Fetch agent details for descriptive messages
  const { data: agent } = await supabase
    .from("delivery_agents")
    .select("name, phone, status")
    .eq("id", agentId)
    .single();

  if (agent && agent.status !== "active") {
    throw new Error(`Cannot assign ${agent.name} because their status is currently marked Inactive.`);
  }

  const { error } = await supabase
    .from("orders")
    .update({ agent_id: agentId })
    .eq("id", orderId);

  if (error) {
    // 23505: PostgreSQL Unique Violation on one_active_order_per_agent index
    if (error.code === "23505" || error.message?.includes("one_active_order_per_agent") || error.message?.includes("duplicate key")) {
      const { data: busyOrder } = await supabase
        .from("orders")
        .select("order_number, status")
        .eq("agent_id", agentId)
        .not("status", "in", '("Delivered","Cancelled","Returned","Refunded")')
        .limit(1)
        .maybeSingle();

      const agentName = agent?.name || "This agent";
      const busyOrderNum = busyOrder?.order_number || "another active order";
      const busyStatus = busyOrder?.status || "In Progress";

      throw new Error(
        `${agentName} is already assigned to active order #${busyOrderNum} (${busyStatus}). Under fleet safety policy, an agent can only handle 1 delivery at a time.`
      );
    }
    throw new Error(error.message || "Failed to assign delivery agent to order.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function unassignAgentFromOrder(orderId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ agent_id: null })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message || "Failed to unassign delivery agent.");
  }

  revalidatePath("/delivery-agents");
  revalidatePath("/admin/delivery-agents");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}
