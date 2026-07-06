"use client";

import { motion } from "framer-motion";
import { Check, Clock, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statuses = [
  { id: "Pending", icon: Clock },
  { id: "Preparing", icon: Package },
  { id: "Packed", icon: Package },
  { id: "Out For Delivery", icon: Truck },
  { id: "Delivered", icon: CheckCircle2 },
];

export function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  // Simple check for cancelled/returned logic
  if (currentStatus === "Cancelled" || currentStatus === "Refunded" || currentStatus === "Returned") {
    return (
      <div className="flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <XCircle className="w-8 h-8" />
        <div>
          <h4 className="font-bold">Order {currentStatus}</h4>
          <p className="text-sm">This order has been {currentStatus.toLowerCase()} and the timeline is halted.</p>
        </div>
      </div>
    );
  }

  const currentIndex = statuses.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {statuses.map((status, index) => {
        const Icon = status.icon;
        const isActive = index <= activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <div key={status.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-500",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>

            {/* Timeline content */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm backdrop-blur-xl transition-all duration-500",
                isCurrent ? "bg-primary/10 border-primary/30" : "bg-card border-border",
                isActive ? "opacity-100" : "opacity-50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className={cn("font-bold", isActive && "text-primary")}>{status.id}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {isCurrent ? "Currently in this stage." : isActive ? "Completed successfully." : "Awaiting this stage."}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
