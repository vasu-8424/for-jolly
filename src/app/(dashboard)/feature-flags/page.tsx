"use client";

import { useState } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Settings2, Smartphone, Shield, Zap } from "lucide-react";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([
    { id: "guest_checkout", name: "Guest Checkout", description: "Allow users to purchase without logging in.", enabled: true, category: "App" },
    { id: "wallet_system", name: "Wallet System", description: "Enable customer wallets and credit tracking.", enabled: true, category: "App" },
    { id: "referral_program", name: "Referral Program", description: "Enable invite & earn rewards.", enabled: false, category: "Marketing" },
    { id: "flash_sales", name: "Flash Sales", description: "Show flash sale banners and timers globally.", enabled: true, category: "Marketing" },
    { id: "push_notifications", name: "Push Notifications", description: "Global kill switch for all automated FCM notifications.", enabled: true, category: "System" },
    { id: "maintenance_mode", name: "Maintenance Mode", description: "Lock down the app and show a maintenance screen.", enabled: false, category: "System" },
  ]);

  const toggleFlag = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Feature Flags & App Config</h1>
          <p className="text-muted-foreground">Instantly toggle features in your Flutter App and Website without deploying new code.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {/* Categories */}
          {['System', 'App', 'Marketing'].map(category => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {category === 'System' && <Server className="w-5 h-5 text-destructive" />}
                {category === 'App' && <Smartphone className="w-5 h-5 text-primary" />}
                {category === 'Marketing' && <Zap className="w-5 h-5 text-warning" />}
                <h2 className="text-lg font-bold">{category} Flags</h2>
              </div>
              
              <div className="space-y-4">
                {flags.filter(f => f.category === category).map((flag) => (
                  <Card key={flag.id} className="border-border shadow-sm bg-card/80 backdrop-blur-xl transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{flag.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 leading-relaxed">
                            {flag.description}
                          </CardDescription>
                        </div>
                        <Switch 
                          checked={flag.enabled}
                          onCheckedChange={() => toggleFlag(flag.id)}
                          className={category === "System" && flag.enabled ? "data-[state=checked]:bg-destructive" : ""}
                        />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <Card className="mt-8 border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <Shield className="w-5 h-5" /> Live Configuration Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These toggles directly update the `feature_flags` table in Supabase. The Flutter app listens to this table via Realtime streams. Toggling a switch here will instantly hide or show the feature for all users currently using the app.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
