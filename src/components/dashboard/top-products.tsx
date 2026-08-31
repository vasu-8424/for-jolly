"use client";

import { TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/actions/products";

export function TopProducts() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const topList = products.slice(0, 5);

  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold">Top Products</CardTitle>
        <CardDescription>Featured catalog items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
              <Package className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No products available</p>
            </div>
          ) : (
            topList.map((product: any, idx: number) => (
              <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{product.categories?.name || "Catalog Item"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{product.selling_price}</p>
                  <p className="text-xs text-success flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    Active
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
