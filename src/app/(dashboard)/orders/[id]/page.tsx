"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Printer, Download, MapPin, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { getOrderById, updateOrderStatus } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrderTimeline } from "@/components/orders/order-timeline";
import Link from "next/link";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    setIsLoading(true);
    let data = await getOrderById(resolvedParams.id);
    
    if (!data) {
      alert("Order not found");
      window.location.href = "/orders";
      return;
    }
    setOrder(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (order) {
      // Optimistic update
      setOrder({ ...order, status: newStatus });
      await updateOrderStatus(order.id, newStatus);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading order details...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/orders">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold">Order #{order.id.substring(0, 8).toUpperCase()}</h1>
                <Badge variant="default" className="text-sm">{order.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Placed on {format(new Date(order.created_at), "MMM dd, yyyy 'at' hh:mm a")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shadow-sm">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] bg-primary text-primary-foreground border-none">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Preparing">Preparing</SelectItem>
                <SelectItem value="Packed">Packed</SelectItem>
                <SelectItem value="Out For Delivery">Out For Delivery</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-md" />
                        <div>
                          <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} x ₹{item.unit_price}</p>
                        </div>
                      </div>
                      <div className="font-bold">
                        ₹{item.total_price}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.total_amount - 40}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Charge</span>
                    <span>₹40.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{order.total_amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
                <CardDescription>Live tracking of the order lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <OrderTimeline currentStatus={order.status} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{order.profiles?.full_name || "Guest"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{order.profiles?.phone_number || "No Phone"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{order.profiles?.email || "No Email"}</span>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm leading-relaxed">{order.delivery_address || "No address provided."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={order.payment_status === "Paid" ? "success" : "warning"}>
                    {order.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="font-medium">{order.payment_method}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
