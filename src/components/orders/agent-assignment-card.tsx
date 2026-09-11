"use client";

import { useEffect, useState } from "react";
import {
  Bike,
  Phone,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  X,
  RefreshCw,
  Copy,
  Check,
  Send,
  Navigation,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDeliveryAgents,
  assignAgentToOrder,
  unassignAgentFromOrder,
  sendAgentOrderAlert,
  DeliveryAgent,
} from "@/actions/delivery-agents";
import toast from "react-hot-toast";

interface AgentAssignmentCardProps {
  order: any;
  onAssigned?: () => void;
}

export function AgentAssignmentCard({ order, onAssigned }: AgentAssignmentCardProps) {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const assignedAgent: DeliveryAgent | null = order?.delivery_agents || null;
  const isOrderTerminal = ["Delivered", "Cancelled", "Returned", "Refunded"].includes(order?.status || "");

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const data = await getDeliveryAgents();
      setAgents(data || []);
    } catch (err: any) {
      console.error("Failed to load delivery agents:", err);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [order?.id]);

  const handleAssign = async (agentIdToAssign?: string) => {
    const targetAgentId = agentIdToAssign || selectedAgentId;
    if (!targetAgentId) {
      toast.error("Please select a delivery agent.");
      return;
    }

    const targetAgent = agents.find((a) => a.id === targetAgentId);

    setIsAssigning(true);
    try {
      const result = await assignAgentToOrder(order.id, targetAgentId);
      const agentPhone = targetAgent?.phone || result.agent?.phone || "";
      toast.success(
        `Agent ${targetAgent?.name || "assigned"}! Order details & location sent to ${agentPhone}.`,
        { duration: 5000 }
      );
      setIsChanging(false);
      setSelectedAgentId("");
      await loadAgents();
      if (onAssigned) onAssigned();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign delivery agent.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign the current delivery agent?")) {
      return;
    }

    setIsUnassigning(true);
    try {
      await unassignAgentFromOrder(order.id);
      toast.success("Delivery agent unassigned.");
      setIsChanging(false);
      setSelectedAgentId("");
      await loadAgents();
      if (onAssigned) onAssigned();
    } catch (err: any) {
      toast.error(err.message || "Failed to unassign delivery agent.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleResendAlert = async () => {
    if (!assignedAgent?.id) return;
    setIsResending(true);
    try {
      const res = await sendAgentOrderAlert(order.id, assignedAgent.id);
      toast.success(`Order details & Google Maps route resent to ${res.agent.name} (${res.agent.phone})!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send alert to agent.");
    } finally {
      setIsResending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    toast.success("Phone number copied to clipboard");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const formatVehicle = (type?: string) => {
    switch ((type || "").toLowerCase()) {
      case "bike":
        return "Motorcycle";
      case "scooter":
        return "Scooter";
      case "cycle":
        return "Bicycle";
      default:
        return "Vehicle";
    }
  };

  const buildAgentWhatsAppUrl = () => {
    if (!assignedAgent) return "#";
    const cleanPhone = (assignedAgent.phone || "").replace(/\D/g, "").slice(-10);
    const recipientName =
      order?.delivery_address_details?.recipient_name ||
      order?.profiles?.full_name ||
      "Valued Customer";
    const recipientPhone =
      order?.delivery_address_details?.recipient_phone ||
      order?.profiles?.phone_number ||
      "N/A";
    const rawAddress =
      order?.delivery_address ||
      order?.delivery_address_details?.full_address ||
      "Kakinada, Andhra Pradesh";
    const landmark = order?.delivery_address_details?.landmark;
    const locationStr = order?.delivery_address_details?.location_string;
    const mapsUrl =
      order?.delivery_address_details?.google_maps_url ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        rawAddress.toLowerCase().includes("kakinada")
          ? rawAddress
          : `${rawAddress}, Kakinada, Andhra Pradesh`
      )}`;

    const isPaid =
      (order?.payment_status || "").toLowerCase() === "paid" ||
      (order?.payment_method || "").toLowerCase().includes("online") ||
      (order?.payment_method || "").toLowerCase().includes("upi") ||
      (order?.payment_method || "").toLowerCase().includes("card") ||
      (order?.payment_method || "").toLowerCase().includes("prepaid");

    const amt = Number(order?.grand_total ?? order?.total_amount ?? 0).toFixed(2);
    const payMsg = isPaid
      ? `✅ PREPAID (ONLINE/UPI) - DO NOT COLLECT (₹${amt})`
      : `💰 CASH ON DELIVERY (COD) - COLLECT ₹${amt} FROM CUSTOMER`;

    const itemsText =
      Array.isArray(order?.order_items) && order.order_items.length > 0
        ? order.order_items
            .map((it: any) => {
              const prep = it.selected_prep_option?.name ? ` [${it.selected_prep_option.name}]` : "";
              return `• ${it.product_name || it.product?.name || "Item"} x ${it.quantity || 1}${prep}`;
            })
            .join("\n")
        : "• Items in packed parcel";

    const text = `🛵 NEW DELIVERY ASSIGNED!
━━━━━━━━━━━━━━━━━━━━
Order #: ${order?.order_number || (order?.id ? order.id.substring(0, 8).toUpperCase() : "N/A")}
Agent: ${assignedAgent.name}

💵 PAYMENT & COLLECTION:
${payMsg}
${order?.delivery_otp ? `🔑 Delivery OTP: ${order.delivery_otp}\n` : ""}
👤 CUSTOMER:
Name: ${recipientName}
Phone: ${recipientPhone}

📍 DELIVERY LOCATION:
${rawAddress}${landmark ? `\nLandmark: Near ${landmark}` : ""}${locationStr && locationStr !== rawAddress ? `\nLocation Area: ${locationStr}` : ""}

🗺️ GOOGLE MAPS NAVIGATION:
${mapsUrl}
${order?.delivery_notes ? `\n📝 Customer Note: ${order.delivery_notes}` : ""}
📦 ITEMS TO DELIVER:
${itemsText}
━━━━━━━━━━━━━━━━━━━━
Store Helpline: 9030982289`;

    return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const agentMapsUrl =
    order?.delivery_address_details?.google_maps_url ||
    (order?.delivery_address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          order.delivery_address.toLowerCase().includes("kakinada")
            ? order.delivery_address
            : `${order.delivery_address}, Kakinada, Andhra Pradesh`
        )}`
      : null);

  return (
    <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Delivery Assignment</CardTitle>
              <CardDescription className="text-xs">
                {assignedAgent ? "Assigned driver & direct dispatch" : "Assign a fleet driver to this order"}
              </CardDescription>
            </div>
          </div>
          {assignedAgent && !isOrderTerminal && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Assigned
            </Badge>
          )}
          {!assignedAgent && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
              <Clock className="w-3 h-3 mr-1" /> Unassigned
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {assignedAgent && !isChanging ? (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                    {assignedAgent.name?.substring(0, 2).toUpperCase() || "AG"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      {assignedAgent.name}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {formatVehicle(assignedAgent.vehicle_type)}
                      {assignedAgent.vehicle_number ? ` • ${assignedAgent.vehicle_number}` : ""}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={assignedAgent.status === "active" ? "default" : "secondary"}
                  className="text-[10px] capitalize font-medium"
                >
                  {assignedAgent.status || "active"}
                </Badge>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <a
                    href={`tel:${assignedAgent.phone}`}
                    className="font-medium text-primary hover:underline font-mono"
                  >
                    +91 {assignedAgent.phone}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(assignedAgent.phone)}
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedPhone ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Direct Instant Action Buttons for Delivery Agent */}
            <div className="space-y-2">
              <Button
                asChild
                className="w-full text-xs font-semibold gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm border-0 h-9"
              >
                <a href={buildAgentWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4 fill-current" />
                  💬 WhatsApp Order & Maps to Agent
                </a>
              </Button>

              <div className="flex items-center gap-2">
                {agentMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <a href={agentMapsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="w-3.5 h-3.5" /> Navigation Link
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendAlert}
                  disabled={isResending}
                  className="flex-1 text-xs h-8 gap-1.5 border-border shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? "Sending..." : "Resend SMS Alert"}
                </Button>
              </div>
            </div>

            {!isOrderTerminal && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8 border-border"
                  onClick={() => {
                    setIsChanging(true);
                    setSelectedAgentId(assignedAgent.id);
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Change Agent
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleUnassign}
                  disabled={isUnassigning}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {isUnassigning ? "Unassigning..." : "Unassign"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {isChanging && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>Select replacement agent:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsChanging(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="agent-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Select Delivery Agent
              </label>

              {isLoadingAgents ? (
                <div className="h-10 rounded-lg border border-border bg-muted/40 animate-pulse flex items-center px-3 text-xs text-muted-foreground">
                  Loading agents roster...
                </div>
              ) : agents.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-border text-center space-y-1 bg-muted/20">
                  <p className="text-xs text-muted-foreground">No delivery agents registered.</p>
                  <a
                    href="/delivery-agents"
                    className="text-xs text-primary font-medium hover:underline inline-block"
                  >
                    + Add agents in Delivery Roster
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    id="agent-select"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="">-- Select an Agent --</option>
                    {agents.map((agent) => {
                      const isCurrent = agent.id === order?.agent_id;
                      const isBusy = agent.is_on_delivery && !isCurrent;
                      const isInactive = agent.status !== "active";

                      let label = `${agent.name} (${agent.phone}) - ${formatVehicle(agent.vehicle_type)}`;
                      if (isCurrent) {
                        label += " [Currently Assigned]";
                      } else if (isBusy) {
                        label += ` [BUSY - Order #${agent.current_order_number?.substring(0, 8) || "active"}]`;
                      } else if (isInactive) {
                        label += " [Inactive]";
                      } else {
                        label += " [Available]";
                      }

                      return (
                        <option
                          key={agent.id}
                          value={agent.id}
                          disabled={isInactive || isBusy}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    💡 <span className="font-medium">Direct Auto-Dispatch:</span> When you assign an agent, the full customer address, location string, Google Maps link, payment mode, and order details are automatically dispatched directly to the agent's phone number.
                  </p>
                </div>
              )}
            </div>

            {agents.length > 0 && (
              <Button
                onClick={() => handleAssign()}
                disabled={!selectedAgentId || isAssigning || isLoadingAgents}
                className="w-full text-xs h-9 font-medium gap-1.5 mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <UserCheck className="w-4 h-4" />
                {isAssigning ? "Assigning & Dispatching..." : isChanging ? "Confirm & Dispatch to Agent" : "Assign & Dispatch to Agent"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

