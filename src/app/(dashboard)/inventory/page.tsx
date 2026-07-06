"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Plus, Minus, History } from "lucide-react";

export default function InventoryPage() {
  const inventoryData = [
    { id: "1", name: "Fresh Tomatoes", sku: "VEG-001", stock: 12, min_stock: 20, status: "Low Stock" },
    { id: "2", name: "Aashirvaad Atta", sku: "GRO-042", stock: 154, min_stock: 50, status: "In Stock" },
    { id: "3", name: "Amul Butter", sku: "DAI-012", stock: 0, min_stock: 15, status: "Out of Stock" },
  ];

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
      header: () => <div className="text-right">Quick Adjust</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Input type="number" defaultValue="0" className="w-20 h-8" />
          <Button size="icon" variant="outline" className="h-8 w-8 text-success hover:text-success hover:bg-success/10"><Plus className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><Minus className="w-4 h-4" /></Button>
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
            <p className="text-muted-foreground mt-2">Monitor stock levels and process adjustments.</p>
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
              <div className="text-3xl font-bold text-destructive">24</div>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">86</div>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">1,248</div>
            </CardContent>
          </Card>
        </div>

        <DataTable columns={columns} data={inventoryData} searchKey="name" />
      </div>
    </PageTransition>
  );
}
