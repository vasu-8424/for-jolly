"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Pencil, Trash2 } from "lucide-react";

export default function CouponManagerPage() {
  // Fetch coupons from Supabase in production
  const coupons: any[] = [];

  const columns = [
    {
      accessorKey: "code",
      header: "Coupon Code",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary tracking-wider">{row.getValue("code")}</span>
        </div>
      )
    },
    {
      accessorKey: "value",
      header: "Discount",
      cell: ({ row }: any) => <span className="font-semibold">{row.getValue("value")}</span>
    },
    {
      accessorKey: "min_order",
      header: "Min. Order",
    },
    {
      accessorKey: "usage",
      header: "Usage / Limit",
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.getValue("active") ? "success" : "secondary"}>
          {row.getValue("active") ? "Active" : "Expired"}
        </Badge>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-destructive">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
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
            <h1 className="text-3xl font-heading font-bold tracking-tight">Coupon Engine</h1>
            <p className="text-muted-foreground mt-2">Create and manage discount codes and promotional offers.</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create Coupon
          </Button>
        </div>

        {coupons.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Coupons Available</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Create your first discount code to boost sales.</p>
            <Button className="mt-6 gap-2">
              <Plus className="w-4 h-4" /> Create Coupon
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={coupons} searchKey="code" />
        )}
      </div>
    </PageTransition>
  );
}
