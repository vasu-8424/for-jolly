"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function StoreSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Store & Delivery</h2>
        <p className="text-muted-foreground">Configure global store rules and delivery physics.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Ordering Rules</CardTitle>
          <CardDescription>Minimum and maximum order constraints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Order Value (₹)</label>
              <Input type="number" defaultValue="99" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Order Value (₹)</label>
              <Input type="number" defaultValue="5000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Delivery Physics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Standard Delivery Charge (₹)</label>
              <Input type="number" defaultValue="40" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Free Delivery Above (₹)</label>
              <Input type="number" defaultValue="499" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Delivery Radius (km)</label>
              <Input type="number" defaultValue="15" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Packaging Fee (₹)</label>
              <Input type="number" defaultValue="5" />
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Express Delivery</p>
                <p className="text-sm text-muted-foreground">Allow users to pay extra for 30-min delivery.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Store Pickup</p>
                <p className="text-sm text-muted-foreground">Allow customers to collect orders from warehouse.</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button className="w-full md:w-auto">Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
