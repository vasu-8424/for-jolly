"use client";

import { Printer, Clock, FileText, Search } from "lucide-react";
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
import { useState } from "react";
import { Input } from "@/components/ui/input";

type InvoiceData = any;

export default function InvoiceManagerPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await getOrders();
      return res || [];
    },
  });

  const getInvoiceNumber = (order: any) => {
    if (order.invoice_number) return order.invoice_number;
    // Fallback format: INV-[YEAR]-[ORD-NUMBER or ID]
    const year = new Date(order.created_at).getFullYear();
    const identifier = order.order_number?.includes('-') 
      ? order.order_number.split('-')[1] 
      : order.id.substring(0, 8).toUpperCase();
    return `INV-${year}-${identifier}`;
  };

  // Filter orders by search query
  const filteredInvoices = orders.filter((order: any) => {
    const invNum = getInvoiceNumber(order).toLowerCase();
    const custName = (order.profiles?.full_name || "").toLowerCase();
    const orderId = order.id.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return invNum.includes(query) || custName.includes(query) || orderId.includes(query);
  });

  const columns: ColumnDef<InvoiceData>[] = [
    {
      id: "invoice_number",
      header: "Invoice No.",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary">
          {getInvoiceNumber(row.original)}
        </span>
      )
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{String(row.getValue("id")).substring(0, 8).toUpperCase()}</span>
    },
    {
      accessorKey: "created_at",
      header: "Invoice Date",
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
      header: "Amount Paid",
      cell: ({ row }) => <span className="font-semibold">₹{Number(row.getValue("total_amount")).toFixed(2)}</span>
    },
    {
      accessorKey: "payment_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("payment_status") === "Paid" ? "success" : "warning"}>
          {String(row.getValue("payment_status"))}
        </Badge>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 shadow-sm" asChild>
              <Link href={`/invoice/${order.id}`} target="_blank">
                <Printer className="w-3.5 h-3.5" /> Print Invoice
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
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Invoice Manager</h1>
          <p className="text-muted-foreground mt-2">Generate, print, and download PDF invoices for customer purchases.</p>
        </div>

        <div className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Invoice No, Customer, Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card shadow-sm">
            <p className="text-muted-foreground animate-pulse">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title={searchQuery ? "No matching invoices" : "No invoices generated yet"}
            description={searchQuery ? "Try checking spelling or search for another term." : "Once orders are completed, you will see billing invoices here."}
          />
        ) : (
          <DataTable columns={columns} data={filteredInvoices} searchKey="invoice_number" />
        )}
      </div>
    </PageTransition>
  );
}
