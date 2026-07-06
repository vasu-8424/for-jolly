"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-3xl font-heading font-bold text-foreground">Failed to load dashboard</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        We encountered a problem while trying to fetch the latest analytics data from the server.
      </p>
      <Button 
        onClick={() => reset()} 
        className="mt-8 gap-2"
        size="lg"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}
