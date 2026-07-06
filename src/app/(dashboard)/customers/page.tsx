"use client";

import { Eye, Mail, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { getCustomers } from "@/actions/customers";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomerData = any;

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await getCustomers();
      return res || [];
    },
  });

  const columns: ColumnDef<CustomerData>[] = [
    {
      accessorKey: "full_name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {String(row.getValue("full_name"))?.charAt(0) || "U"}
          </div>
          <div>
            <p className="font-medium">{String(row.getValue("full_name"))}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> {row.original.phone_number}
            </p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <Mail className="w-3 h-3 text-muted-foreground" /> {String(row.getValue("email")) || "N/A"}
        </span>
      )
    },
    {
      accessorKey: "created_at",
      header: "Joined On",
      cell: ({ row }) => <span className="text-sm">{format(new Date(String(row.getValue("created_at"))), "MMM dd, yyyy")}</span>
    },
    {
      accessorKey: "wallet",
      header: "Wallet Balance",
      cell: ({ row }) => {
        const wallet = row.original.wallets?.[0];
        return <span className="font-semibold text-success">₹{wallet?.balance || 0}</span>;
      }
    },
    {
      accessorKey: "rewards",
      header: "Reward Tier",
      cell: ({ row }) => {
        const points = row.original.wallets?.[0]?.reward_points || 0;
        const tier = points > 1000 ? "Gold" : points > 500 ? "Silver" : "Bronze";
        return <Badge variant={tier === "Gold" ? "default" : "secondary"}>{tier}</Badge>;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/customers/${customer.id}`}>
                View Profile
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
            <h1 className="text-3xl font-heading font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-2">Manage customer profiles, wallets, and rewards.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card shadow-sm">
            <p className="text-muted-foreground animate-pulse">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Customers Yet"
            description="Customers will appear here once they register via the mobile app or website."
          />
        ) : (
          <DataTable columns={columns} data={customers} searchKey="full_name" />
        )}
      </div>
    </PageTransition>
  );
}
