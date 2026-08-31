"use client";

import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/actions/products";
import Link from "next/link";

export function LowStockWidget() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const lowStockItems = products.filter((p: any) => Number(p.stock) <= Number(p.minimum_stock ?? 10)).slice(0, 5);

  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-heading font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Products requiring immediate restocking</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-2">
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <Package className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">All products are well stocked!</p>
            </div>
          ) : (
            lowStockItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-secondary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={Number(item.stock) === 0 ? "text-destructive font-bold" : "text-warning font-bold"}>
                        {item.stock} left
                      </span>{" "}
                      (Min: {item.minimum_stock ?? 10})
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8" asChild>
                  <Link href={`/products/${item.id}`}>Update</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
