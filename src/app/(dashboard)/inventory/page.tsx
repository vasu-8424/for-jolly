"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, History, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/actions/products";
import Link from "next/link";

export default function InventoryPage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const inventoryData = products.map((product: any) => {
    const stock = Number(product.stock ?? 0);
    const minStock = Number(product.minimum_stock ?? 10);
    let status = "In Stock";
    if (stock === 0) status = "Out of Stock";
    else if (stock <= minStock) status = "Low Stock";

    return {
      id: product.id,
      name: product.name,
      sku: product.sku || `SKU-${product.id.slice(0, 5)}`,
      stock,
      minStock,
      status,
    };
  });

  const outOfStockCount = inventoryData.filter((i: any) => i.stock === 0).length;
  const lowStockCount = inventoryData.filter((i: any) => i.stock > 0 && i.stock <= i.minStock).length;
  const totalCount = inventoryData.length;

  const columns = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }: any) => <span className="font-medium">{row.getValue("name")}</span>
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "stock",
      header: "Current Stock",
      cell: ({ row }: any) => {
        const stock = row.getValue("stock");
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold">{stock}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === "Out of Stock" ? "destructive" : status === "Low Stock" ? "warning" : "default"}>
            {status}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/products/${row.original.id}`}>Manage</Link>
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground mt-2">Monitor live stock levels and process adjustments.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            Movement History
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-destructive/10 border-destructive/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{outOfStockCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{lowStockCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                <Package className="w-4 h-4" /> Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{totalCount}</div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
            <p className="text-muted-foreground animate-pulse">Loading inventory...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={inventoryData} searchKey="name" />
        )}
      </div>
    </PageTransition>
  );
}
