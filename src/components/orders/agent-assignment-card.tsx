"use client";

import { useEffect, useState } from "react";
import { Bike, Phone, User, CheckCircle2, Clock, AlertTriangle, UserCheck, X, RefreshCw, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDeliveryAgents, assignAgentToOrder, unassignAgentFromOrder, DeliveryAgent } from "@/actions/delivery-agents";
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

    setIsAssigning(true);
    try {
      await assignAgentToOrder(order.id, targetAgentId);
      toast.success("Delivery agent assigned successfully!");
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
                {assignedAgent ? "Assigned agent details" : "Assign a fleet driver to this order"}
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
                    className="font-medium text-primary hover:underline"
                  >
                    {assignedAgent.phone}
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

            {!isOrderTerminal && (
              <div className="flex items-center gap-2 pt-1">
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
                    💡 <span className="font-medium">Safety Rule:</span> Agents currently on an active order cannot take new assignments until their delivery is completed.
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
                {isAssigning ? "Assigning..." : isChanging ? "Confirm Reassignment" : "Assign to Order"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
