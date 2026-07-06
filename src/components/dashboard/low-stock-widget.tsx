"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const lowStockItems: any[] = [];

export function LowStockWidget() {
  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Products requiring immediate restocking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-sm text-muted-foreground">All products are well stocked!</p>
            </div>
          ) : (
            lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-secondary/20 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={item.stock === 0 ? "text-destructive font-bold" : "text-warning font-bold"}>
                        {item.stock} left
                      </span>{" "}
                      (Min: {item.min})
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8">Update</Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
