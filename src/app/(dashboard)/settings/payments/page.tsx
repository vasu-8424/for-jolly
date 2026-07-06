"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function PaymentSettingsPage() {
  const gateways = [
    { id: "cod", name: "Cash on Delivery", description: "Collect payment at customer door.", enabled: true, tag: "Default" },
    { id: "upi", name: "UPI Integration", description: "Direct UPI intent flow for GPay, PhonePe, Paytm.", enabled: true, tag: "Recommended" },
    { id: "razorpay", name: "Razorpay Gateway", description: "Credit Cards, Netbanking & Wallets.", enabled: false, tag: "Add-on" },
    { id: "wallet", name: "Kakinada Wallet", description: "Allow customers to pay using their store wallet balance.", enabled: true, tag: "Internal" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
        <p className="text-muted-foreground">Toggle available checkout options for customers.</p>
      </div>

      <div className="space-y-4">
        {gateways.map((gw) => (
          <Card key={gw.id} className="border-border shadow-sm">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{gw.name}</CardTitle>
                  <Badge variant={gw.enabled ? "success" : "secondary"}>{gw.tag}</Badge>
                </div>
                <Switch defaultChecked={gw.enabled} />
              </div>
              <CardDescription className="mt-1 text-sm">{gw.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
