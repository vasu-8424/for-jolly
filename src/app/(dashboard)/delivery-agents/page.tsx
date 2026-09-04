"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Plus,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Slash,
  Truck,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreVertical,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  UserX,
  Users,
} from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDeliveryAgents,
  setAgentStatus,
  deleteDeliveryAgent,
  DeliveryAgent,
} from "@/actions/delivery-agents";
import { AgentFormDialog } from "@/components/delivery-agents/agent-form-dialog";
import Link from "next/link";
import toast from "react-hot-toast";

type FilterStatus = "all" | "available" | "on_delivery" | "inactive";

export default function DeliveryAgentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch Agents Query
  const {
    data: agents = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["delivery-agents"],
    queryFn: getDeliveryAgents,
  });

  // 2. Status toggle mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: "active" | "inactive" }) => {
      return await setAgentStatus(id, newStatus);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Agent marked as ${variables.newStatus}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update agent status");
    },
  });

  // 3. Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteDeliveryAgent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Delivery agent removed from roster");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete delivery agent");
    },
  });

  const handleDelete = (agent: DeliveryAgent) => {
    if (agent.is_on_delivery) {
      toast.error(
        `Cannot delete ${agent.name} while they have an active delivery (Order #${agent.current_order_number || "Active"}).`
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete delivery agent "${agent.name}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(agent.id);
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success("Phone number copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Metrics Calculation
  const totalCount = agents.length;
  const availableCount = agents.filter((a) => a.is_available).length;
  const onDeliveryCount = agents.filter((a) => a.is_on_delivery).length;
  const inactiveCount = agents.filter((a) => (a.status || "").toLowerCase() !== "active").length;

  // Filtered Roster
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = agent.name?.toLowerCase().includes(q);
        const matchesPhone = agent.phone?.toLowerCase().includes(q);
        const matchesEmail = agent.email?.toLowerCase().includes(q);
        const matchesVehicle = agent.vehicle_number?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesVehicle) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === "available" && !agent.is_available) return false;
      if (statusFilter === "on_delivery" && !agent.is_on_delivery) return false;
      if (statusFilter === "inactive" && (agent.status || "").toLowerCase() === "active") return false;

      // Vehicle filter
      if (vehicleFilter !== "all" && (agent.vehicle_type || "").toLowerCase() !== vehicleFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [agents, searchQuery, statusFilter, vehicleFilter]);

  const formatVehicleType = (type?: string) => {
    switch ((type || "").toLowerCase()) {
      case "bike":
        return "Motorcycle";
      case "scooter":
        return "Scooter";
      case "cycle":
        return "Bicycle";
      default:
        return type || "Vehicle";
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Bike className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
                Delivery Agents
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your delivery fleet roster, monitor live delivery statuses, and assign orders.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 shadow-xs border-border bg-card hover:bg-muted"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingAgent(null);
                setIsFormOpen(true);
              }}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Delivery Agent
            </Button>
          </div>
        </div>

        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border shadow-xs bg-card/80 backdrop-blur-xl hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Roster
              </CardTitle>
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-foreground">{totalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered drivers in system</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/80 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Available Now
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                {availableCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for immediate dispatch</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/80 backdrop-blur-xl hover:border-amber-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                On Delivery
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Truck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">
                {onDeliveryCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active transit (1 order each)</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/80 backdrop-blur-xl hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inactive
              </CardTitle>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <UserX className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading text-muted-foreground">{inactiveCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Off duty / Toggled inactive</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 p-3.5 rounded-xl border border-border backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/80 border-border text-sm"
              />
            </div>

            {/* Vehicle Select */}
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Vehicle Types</option>
              <option value="bike">Motorcycles</option>
              <option value="scooter">Scooters</option>
              <option value="cycle">Bicycles</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <Button
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs h-8 px-3 rounded-lg"
            >
              All ({totalCount})
            </Button>
            <Button
              variant={statusFilter === "available" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("available")}
              className={`text-xs h-8 px-3 rounded-lg ${
                statusFilter === "available" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
            >
              Available ({availableCount})
            </Button>
            <Button
              variant={statusFilter === "on_delivery" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("on_delivery")}
              className={`text-xs h-8 px-3 rounded-lg ${
                statusFilter === "on_delivery" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              }`}
            >
              On Delivery ({onDeliveryCount})
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
              className="text-xs h-8 px-3 rounded-lg"
            >
              Inactive ({inactiveCount})
            </Button>
          </div>
        </div>

        {/* Content Table / Empty States */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center border border-border rounded-xl bg-card shadow-xs">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading delivery agents roster...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="No Delivery Agents Registered"
            description="Build your internal delivery fleet roster by adding your first delivery agent."
            action={
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setEditingAgent(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Add First Agent
              </Button>
            }
          />
        ) : filteredAgents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Matching Agents Found"
            description="Try changing your search terms or clearing your status filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setVehicleFilter("all");
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-border">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Agent</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Vehicle</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Live Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Active Switch</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => {
                  const isActive = (agent.status || "").toLowerCase() === "active";

                  return (
                    <TableRow key={agent.id} className="hover:bg-muted/40 border-b-border/60 transition-colors">
                      {/* Agent Name & Avatar */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                            {agent.name?.substring(0, 2).toUpperCase() || "AG"}
                          </div>
                          <div>
                            <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                              {agent.name}
                            </div>
                            {agent.email ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3 text-muted-foreground/70" />
                                {agent.email}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">No email registered</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone & Copy */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <a
                              href={`tel:${agent.phone}`}
                              className="text-sm font-mono text-primary hover:underline font-medium"
                            >
                              {agent.phone}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyPhone(agent.id, agent.phone)}
                            title="Copy phone"
                          >
                            {copiedId === agent.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>

                      {/* Vehicle Details */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[11px] capitalize font-medium">
                              <Bike className="w-3 h-3 mr-1 text-muted-foreground" />
                              {formatVehicleType(agent.vehicle_type)}
                            </Badge>
                          </div>
                          {agent.vehicle_number ? (
                            <span className="text-xs font-mono font-medium text-muted-foreground">
                              {agent.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60">No plate number</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Live Status Badge */}
                      <TableCell className="py-3.5">
                        {agent.is_on_delivery ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-medium"
                            >
                              <Truck className="w-3 h-3 mr-1" /> On Delivery
                            </Badge>
                            {agent.current_order_id && (
                              <Link
                                href={`/orders/${agent.current_order_id}`}
                                className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                              >
                                Order #{agent.current_order_number || agent.current_order_id.substring(0, 8)}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        ) : agent.is_available ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-muted-foreground font-medium">
                            <Slash className="w-3 h-3 mr-1" /> Inactive
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status Toggle Switch */}
                      <TableCell className="py-3.5 text-center">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => {
                            toggleStatusMutation.mutate({
                              id: agent.id,
                              newStatus: checked ? "active" : "inactive",
                            });
                          }}
                          disabled={toggleStatusMutation.isPending}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingAgent(agent);
                                setIsFormOpen(true);
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Edit Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyPhone(agent.id, agent.phone)}
                              className="cursor-pointer gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy Phone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(agent)}
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" /> Delete Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Agent Modal */}
        <AgentFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          agent={editingAgent}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
          }}
        />
      </div>
    </PageTransition>
  );
}
