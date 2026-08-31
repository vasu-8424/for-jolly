"use client";

import { Eye, Clock, Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/layout/page-transition";
import { getOrders } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderData = any;

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await getOrders();
      return res || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'preparing': return 'default';
      case 'packed': return 'default';
      case 'out for delivery': return 'default';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      case 'returned': return 'destructive';
      case 'refunded': return 'secondary';
      default: return 'outline';
    }
  };

  const columns: ColumnDef<OrderData>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-mono font-semibold">{String(row.getValue("id")).substring(0, 8).toUpperCase()}</span>
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{format(new Date(String(row.getValue("created_at"))), "MMM dd, yyyy")}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {format(new Date(String(row.getValue("created_at"))), "hh:mm a")}
          </span>
        </div>
      )
    },
    {
      accessorKey: "profiles.full_name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-primary">{row.original.profiles?.full_name || "Guest"}</span>
          <span className="text-xs text-muted-foreground">{row.original.profiles?.phone_number}</span>
        </div>
      )
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-semibold">₹{Number(row.getValue("total_amount")).toFixed(2)}</span>
    },
    {
      accessorKey: "status",
      header: "Order Status",
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        return (
          <Badge variant={getStatusColor(status) as any}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Badge variant={row.getValue("payment_status") === "Paid" ? "success" : "outline"} className="w-fit text-[10px]">
            {String(row.getValue("payment_status"))}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{row.original.payment_method}</span>
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild title="View Details">
              <Link href={`/orders/${order.id}`}>
                <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild title="Download Invoice">
              <Link href={`/invoice/${order.id}`} target="_blank">
                <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground mt-2">View and process customer orders in real-time.</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="shadow-sm">Export CSV</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card shadow-sm">
            <p className="text-muted-foreground animate-pulse">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState 
            icon={ShoppingCart}
            title="No orders yet"
            description="When customers place orders on the app, they will appear here."
          />
        ) : (
          <DataTable columns={columns} data={orders} searchKey="id" />
        )}
      </div>
    </PageTransition>
  );
}
