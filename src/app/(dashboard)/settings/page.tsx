"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Business Profile</h2>
        <p className="text-muted-foreground">Manage your company details and contact information.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>This information will appear on invoices and customer emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input defaultValue="Kakinada Fresh" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GSTIN</label>
              <Input defaultValue="37ABCDE1234F1Z5" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Support Email</label>
            <Input defaultValue="support@kakinadafresh.com" type="email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Support Phone (WhatsApp)</label>
            <Input defaultValue="+91 9000000000" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Registered Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Street Address</label>
            <Textarea defaultValue="Main Road, Near Clock Tower" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input defaultValue="Kakinada" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input defaultValue="Andhra Pradesh" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PIN Code</label>
              <Input defaultValue="533001" />
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
