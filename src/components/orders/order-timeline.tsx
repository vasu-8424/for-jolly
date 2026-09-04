"use client";

import { motion } from "framer-motion";
import { Clock, Package, Bike, Truck, CheckCircle2, XCircle, Check, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface OrderTimelineProps {
  currentStatus: string;
  assignedAgent?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicle_type?: string;
    vehicle_number?: string | null;
    status?: string;
  } | null;
}

export function OrderTimeline({ currentStatus, assignedAgent }: OrderTimelineProps) {
  const normStatus = (currentStatus || "").toLowerCase();

  // Cancelled / Returned / Refunded terminal exception
  if (normStatus === "cancelled" || normStatus === "refunded" || normStatus === "returned") {
    return (
      <div className="flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <XCircle className="w-8 h-8 shrink-0" />
        <div>
          <h4 className="font-bold capitalize">Order {currentStatus}</h4>
          <p className="text-sm">This order has been {normStatus} and the delivery timeline is halted.</p>
        </div>
      </div>
    );
  }

  const isAgentAssigned = !!assignedAgent?.name || !!assignedAgent?.id;

  const steps = [
    {
      id: "Pending",
      title: "Order Placed",
      icon: Clock,
      description: "Order received and acknowledged by store.",
    },
    {
      id: "Preparing",
      title: "Preparing Order",
      icon: Package,
      description: "Items are being picked and prepared.",
    },
    {
      id: "Packed",
      title: "Order Packed",
      icon: CheckCircle2,
      description: "Items packed securely and ready for pickup.",
    },
    {
      id: "AgentAssigned",
      title: "Delivery Partner Assigned",
      icon: Bike,
      description: isAgentAssigned
        ? `Assigned to ${assignedAgent?.name}`
        : "Awaiting delivery partner assignment.",
      agentInfo: isAgentAssigned ? assignedAgent : null,
    },
    {
      id: "Out For Delivery",
      title: "Out For Delivery",
      icon: Truck,
      description: "Delivery partner is on the way to customer address.",
    },
    {
      id: "Delivered",
      title: "Delivered",
      icon: ShieldCheck,
      description: "Order successfully handed over and OTP verified.",
    },
  ];

  // Calculate active index
  let activeIndex = 0;
  if (normStatus === "pending") {
    activeIndex = 0;
  } else if (normStatus === "preparing") {
    activeIndex = 1;
  } else if (normStatus === "packed") {
    // If agent is assigned, progress moves to partner assigned step
    activeIndex = isAgentAssigned ? 3 : 2;
  } else if (normStatus === "out for delivery") {
    activeIndex = 4;
  } else if (normStatus === "delivered") {
    activeIndex = 5;
  }

  // Progress line height percentage
  const totalSteps = steps.length;
  const progressPercent = (activeIndex / (totalSteps - 1)) * 100;

  return (
    <div className="relative space-y-8 py-2">
      {/* Background Track Line */}
      <div className="absolute left-5 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-muted/60 rounded-full" />

      {/* Dynamic Animated Active Progress Line */}
      <motion.div
        className="absolute left-5 md:left-1/2 top-4 w-1 -translate-x-1/2 bg-gradient-to-b from-emerald-500 via-primary to-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] origin-top"
        initial={{ height: "0%" }}
        animate={{ height: `${progressPercent}%` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < activeIndex;
        const isCurrent = index === activeIndex;
        const isPending = index > activeIndex;

        return (
          <div
            key={step.id}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Timeline Icon Node */}
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? [1, 1.12, 1] : 1,
              }}
              transition={
                isCurrent
                  ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10 transition-all duration-500",
                isCompleted && "bg-emerald-600 text-white shadow-emerald-500/20",
                isCurrent &&
                  "bg-primary text-primary-foreground ring-4 ring-primary/30 shadow-[0_0_16px_rgba(16,185,129,0.4)]",
                isPending && "bg-muted text-muted-foreground/60 border-border"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </motion.div>

            {/* Timeline Content Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className={cn(
                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-xs backdrop-blur-xl transition-all duration-500",
                isCurrent
                  ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-md"
                  : isCompleted
                  ? "bg-card/90 border-border/80"
                  : "bg-card/40 border-border/40 opacity-60"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4
                  className={cn(
                    "font-semibold text-sm flex items-center gap-1.5",
                    isCurrent && "text-primary font-bold",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </h4>

                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="bg-primary/20 text-primary border-primary/30 text-[10px] px-2 py-0.5 animate-pulse"
                  >
                    Active Stage
                  </Badge>
                )}
                {isCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0"
                  >
                    Completed
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Special Agent Details Display inside the AgentAssigned stage */}
              {step.agentInfo && (
                <div className="mt-2.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs bg-muted/30 -mx-2 px-2.5 py-1.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                      {step.agentInfo.name?.substring(0, 2).toUpperCase() || "AG"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-xs">{step.agentInfo.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {step.agentInfo.vehicle_type || "Bike"}
                        {step.agentInfo.vehicle_number ? ` • ${step.agentInfo.vehicle_number}` : ""}
                      </p>
                    </div>
                  </div>
                  {step.agentInfo.phone && (
                    <a
                      href={`tel:${step.agentInfo.phone}`}
                      className="text-primary font-mono text-xs hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {step.agentInfo.phone}
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
