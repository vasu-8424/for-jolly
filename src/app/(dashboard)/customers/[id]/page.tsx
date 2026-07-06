"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Wallet, Gift, ShoppingBag, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { getCustomerById, addWalletCredit } from "@/actions/customers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCredit, setIsAddingCredit] = useState(false);

  const fetchCustomer = async () => {
    setIsLoading(true);
    let data = await getCustomerById(resolvedParams.id);
    
    if (!data) {
      alert("Customer not found");
      window.location.href = "/customers";
      return;
    }
    setCustomer(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomer();
  }, [resolvedParams.id]);

  const handleAddCredit = async () => {
    setIsAddingCredit(true);
    // In a real app, this would open a dialog to input amount and reason
    const amount = Number(prompt("Enter amount to credit to wallet:"));
    if (amount > 0) {
      const result = await addWalletCredit(resolvedParams.id, amount, "Admin Manual Credit");
      if (result.success) {
        fetchCustomer();
      } else {
        alert("Failed to add credit: " + result.error);
      }
    }
    setIsAddingCredit(false);
  };

  if (isLoading || !customer) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  const wallet = customer.wallets?.[0] || { balance: 0, reward_points: 0 };
  const totalSpent = customer.orders?.reduce((acc: number, ord: any) => acc + ord.total_amount, 0) || 0;

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl text-primary font-bold">
              {customer.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">{customer.full_name}</h1>
              <p className="text-muted-foreground">{customer.phone_number} | {customer.email}</p>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Wallet className="w-5 h-5" />
                <h3 className="font-semibold">Wallet Balance</h3>
              </div>
              <p className="text-3xl font-bold">₹{wallet.balance.toFixed(2)}</p>
              <Button size="sm" variant="outline" className="w-full mt-4 gap-2 bg-background" onClick={handleAddCredit} disabled={isAddingCredit}>
                <Plus className="w-4 h-4" /> Add Credit
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-warning/5 border-warning/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-warning mb-2">
                <Gift className="w-5 h-5" />
                <h3 className="font-semibold">Reward Points</h3>
              </div>
              <p className="text-3xl font-bold">{wallet.reward_points}</p>
              <Badge variant="outline" className="mt-4 border-warning text-warning">Gold Tier</Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground mb-2">
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-semibold">Lifetime Orders</h3>
              </div>
              <p className="text-3xl font-bold">{customer.orders?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground mb-2">
                <h3 className="font-semibold">Total Spent</h3>
              </div>
              <p className="text-3xl font-bold">₹{totalSpent.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Order history for this customer.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.orders?.length === 0 ? (
                    <p className="text-muted-foreground">No orders found.</p>
                  ) : (
                    customer.orders?.map((ord: any) => (
                      <div key={ord.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">ORD-{ord.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(ord.created_at), "MMM dd, yyyy")}</p>
                        </div>
                        <Badge variant={ord.status === "Delivered" ? "success" : "default"}>{ord.status}</Badge>
                        <div className="font-bold">₹{ord.total_amount.toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.addresses?.length === 0 ? (
                  <p className="text-muted-foreground">No saved addresses.</p>
                ) : (
                  customer.addresses?.map((addr: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-xl bg-muted/20">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <Badge variant="secondary" className="mb-1">{addr.type || "Home"}</Badge>
                        <p className="text-sm leading-relaxed">{addr.full_address}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
