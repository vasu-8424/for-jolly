"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Timer, Zap, Search } from "lucide-react";

export default function FlashSalesPage() {
  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-warning flex items-center gap-2">
              <Zap className="w-8 h-8" fill="currentColor" /> Flash Sales
            </h1>
            <p className="text-muted-foreground mt-2">Manage limited-time, high-discount campaigns with global countdown timers.</p>
          </div>
          <Button className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90">
            <Plus className="w-4 h-4" /> Create Flash Sale
          </Button>
        </div>

        {/* Empty State */}
        <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50 mt-8">
          <Zap className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Active Flash Sales</h3>
          <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Create high-urgency, time-limited sales events to boost conversions.</p>
          <Button className="mt-6 gap-2 bg-warning text-warning-foreground hover:bg-warning/90">
            <Plus className="w-4 h-4" /> Create Flash Sale
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
