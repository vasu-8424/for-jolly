"use client";

import { MoreHorizontal, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { format } from "date-fns";

export function RecentOrders({ orders = [] }: { orders?: any[] }) {
  // Show top 5 recent orders on dashboard
  const recentList = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'preparing': return 'default';
      case 'packed': return 'default';
      case 'out for delivery': return 'default';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-heading font-semibold">Recent Orders</CardTitle>
          <CardDescription>Latest transactions in your store</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/orders">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Order ID</TableHead>
                <TableHead className="font-semibold text-foreground">Customer</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Amount</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No recent orders
                  </TableCell>
                </TableRow>
              ) : (
                recentList.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-semibold text-primary">
                      {order.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.profiles?.full_name || "Guest"}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "MMM dd, hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status) as any} className="font-normal text-xs">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">₹{Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Link href={`/orders/${order.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                              <Eye className="w-3.5 h-3.5" /> View Order
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
