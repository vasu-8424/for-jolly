import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center w-full min-h-[400px] p-8 text-center rounded-2xl border border-dashed border-border bg-card/30 backdrop-blur-sm", className)}>
      <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-primary/10 text-primary">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="mb-2 text-xl font-heading font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="max-w-sm mb-8 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
