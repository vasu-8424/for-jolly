"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KeyRound, ShieldAlert } from "lucide-react";

export default function AdminProfilePage() {
  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your super-admin account settings.</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">KF</AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Photo</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue="Admin Kakinada" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input defaultValue="admin@kakinadafresh.com" disabled />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button>Update Profile</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Security
            </CardTitle>
            <CardDescription>Update your Supabase Auth password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input type="password" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between items-center">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" /> You will be logged out of all other devices.
            </p>
            <Button variant="destructive">Change Password</Button>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
}
