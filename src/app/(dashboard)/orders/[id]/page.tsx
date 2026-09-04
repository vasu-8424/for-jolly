"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Printer, Download, MapPin, Phone, Mail, User, ShieldCheck, Navigation, KeyRound, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { getOrderById, updateOrderStatus, verifyAndDeliverOrder } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrderTimeline } from "@/components/orders/order-timeline";
import Link from "next/link";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AgentAssignmentCard } from "@/components/orders/agent-assignment-card";
import { createClient } from "@/lib/supabase/client";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchOrder = async () => {
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

    // Supabase Real-time postgres_changes listener
    const supabase = createClient();
    const channel = supabase
      .channel(`order-live-${resolvedParams.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${resolvedParams.id}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    if (newStatus === "Delivered") {
      setOtpInput("");
      setOtpError("");
      setIsOtpOpen(true);
      return;
    }

    setOrder({ ...order, status: newStatus });
    await updateOrderStatus(order.id, newStatus);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length < 4) {
      setOtpError("Please enter a valid 4-digit Delivery OTP.");
      return;
    }
    setIsVerifying(true);
    setOtpError("");

    const res = await verifyAndDeliverOrder(order.id, otpInput.trim());
    setIsVerifying(false);

    if (res.success) {
      setIsOtpOpen(false);
      setOrder({ ...order, status: "Delivered", payment_status: "Paid" });
    } else {
      setOtpError(res.error || "Invalid OTP code. Ask customer for their unique 4-digit PIN.");
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
            <Button variant="outline" className="gap-2 shadow-sm" asChild>
              <Link href={`/invoice/${order.id}`} target="_blank">
                <Printer className="w-4 h-4" /> Print
              </Link>
            </Button>
            <Button variant="outline" className="gap-2 shadow-sm" asChild>
              <Link href={`/invoice/${order.id}`} target="_blank">
                <Download className="w-4 h-4" /> Invoice
              </Link>
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
                  {order.order_items?.map((item: any) => {
                    const prepName = item.selected_prep_option?.name;
                    const extras = Array.isArray(item.selected_extras) ? item.selected_extras : [];
                    const imgUrl = item.product?.image_url || (item.product?.product_images?.[0]?.image_url);

                    return (
                      <div key={item.id} className="flex items-start justify-between py-3 border-b last:border-0">
                        <div className="flex items-start gap-4">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.product_name || "Product"} className="w-12 h-12 object-cover rounded-md border shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-md border flex items-center justify-center text-muted-foreground/50 shrink-0 text-xs font-bold">
                              {item.product_name ? item.product_name.substring(0, 2).toUpperCase() : "IT"}
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground text-sm">
                              {item.product_name || item.product?.name || "Product"}
                            </p>
                            
                            {(prepName || extras.length > 0) && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {prepName && (
                                  <span className="inline-flex items-center text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Cut: {prepName} {Number(item.selected_prep_option?.price_adjustment) > 0 ? `(+₹${item.selected_prep_option.price_adjustment})` : ""}
                                  </span>
                                )}
                                {extras.map((ex: any, exIdx: number) => {
                                  const extraName = typeof ex === "string" ? ex : ex?.name;
                                  const extraAdj = typeof ex === "object" ? Number(ex?.price_adjustment) : 0;
                                  return (
                                    <span key={exIdx} className="inline-flex items-center text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                      + {extraName} {extraAdj > 0 ? `(+₹${extraAdj})` : ""}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} x ₹{item.unit_price}</p>
                          </div>
                        </div>
                        <div className="font-bold text-base">
                          ₹{item.total_price}
                        </div>
                      </div>
                    );
                  })}
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
                <OrderTimeline currentStatus={order.status} assignedAgent={order.delivery_agents} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Customer & Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">
                      {order.delivery_address_details?.recipient_name || order.profiles?.full_name || "Customer"}
                    </span>
                    {order.delivery_address_details?.recipient_name && order.delivery_address_details.recipient_name !== order.profiles?.full_name && (
                      <span className="text-xs text-muted-foreground block">Account: {order.profiles?.full_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                  <a 
                    href={`tel:${order.delivery_address_details?.recipient_phone || order.profiles?.phone_number}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {order.delivery_address_details?.recipient_phone || order.profiles?.phone_number || "No Phone"}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{order.profiles?.email || "No Email"}</span>
                </div>
                
                <div className="pt-4 border-t mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery Address
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {order.delivery_address_details?.type || "Delivery Address"}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border">
                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        {order.delivery_address || "No address provided."}
                      </p>
                      {order.delivery_address_details?.landmark && (
                        <p className="text-xs text-muted-foreground">
                          Landmark: {order.delivery_address_details.landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.delivery_address_details?.google_maps_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="w-full gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                    >
                      <a 
                        href={order.delivery_address_details.google_maps_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4" /> Open in Google Maps
                      </a>
                    </Button>
                  )}

                  {order.delivery_notes && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Delivery Notes:</span>
                        {order.delivery_notes}
                      </div>
                    </div>
                  )}

                  {order.delivery_otp && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                      <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" /> Delivery OTP:
                      </span>
                      <span className="font-mono font-bold text-sm text-primary">
                        {order.delivery_otp}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <AgentAssignmentCard order={order} onAssigned={fetchOrder} />

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
                {order.payment_transactions && order.payment_transactions.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gateway</span>
                      <span className="font-medium">{order.payment_transactions[0].payment_provider || "Razorpay"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Transaction ID</span>
                      <span className="font-medium">{order.payment_transactions[0].gateway_transaction_id}</span>
                    </div>
                  </>
                )}
                {order.payment_status === "Paid" && (
                  <div className="pt-4 border-t mt-4">
                    <Button variant="destructive" className="w-full" onClick={() => {
                      if (confirm('Initiate refund?')) {
                         // call refund endpoint
                         alert('Refund initiated');
                      }
                    }}>
                      Initiate Refund
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5 text-primary" /> Verify Delivery OTP
            </DialogTitle>
            <DialogDescription>
              Ask the customer for their unique 4-digit Delivery OTP to mark Order #{order.id.substring(0, 8).toUpperCase()} as Delivered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Delivery OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="e.g. 5824"
                className="w-full text-center text-2xl font-bold tracking-widest px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            {otpError && (
              <p className="text-sm font-medium text-destructive">{otpError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOtpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Confirm & Deliver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
