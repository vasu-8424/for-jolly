"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const topProducts: any[] = [];

export function TopProducts() {
  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold">Top Selling Products</CardTitle>
        <CardDescription>Based on revenue this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <p className="text-sm text-muted-foreground">Not enough data to calculate top products</p>
            </div>
          ) : (
            topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{product.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{product.revenue}</p>
                  <p className="text-xs text-success flex items-center justify-end gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {product.growth}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
