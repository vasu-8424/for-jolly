"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Image as ImageIcon, Smartphone } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const [title, setTitle] = useState("Big Monsoon Sale!");
  const [message, setMessage] = useState("Get flat 50% off on all fresh fruits. Valid till midnight.");

  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Push Notifications</h1>
            <p className="text-muted-foreground mt-2">Send FCM broadcast messages directly to the Flutter app.</p>
          </div>
          <Button className="gap-2 shadow-lg bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" /> Dispatch Now
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Notification Builder</CardTitle>
              <CardDescription>Compose your push payload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registered Users</SelectItem>
                    <SelectItem value="active">Active this month</SelectItem>
                    <SelectItem value="inactive">Inactive (30+ days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Flash Sale Alert!" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Body</label>
                <Textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Keep it short and catchy..." 
                  className="h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deep Link (Optional)</label>
                <Input placeholder="E.g., /flash-sale or /product/123" />
                <p className="text-xs text-muted-foreground">App will open directly to this screen.</p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <Button variant="outline" className="gap-2 border-dashed">
                  <ImageIcon className="w-4 h-4" /> Add Big Image
                </Button>
                <Button variant="outline" className="gap-2">
                  <Bell className="w-4 h-4" /> Schedule for Later
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center items-start lg:mt-8">
            <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl overflow-hidden flex flex-col pt-12">
              <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-3xl w-40 mx-auto" />
              
              {/* Flutter App Mockup Screen */}
              <div className="flex-1 bg-white relative">
                {/* Status bar mock */}
                <div className="h-6 bg-white w-full flex items-center justify-between px-6 absolute top-0 z-10 text-[10px] font-medium">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 bg-black rounded-sm" />
                  </div>
                </div>

                {/* Mock Wallpaper */}
                <div className="absolute inset-0 bg-gray-100 p-4 pt-16">
                  {/* The Push Notification Mock */}
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kakinada Fresh</span>
                        <span className="text-xs text-gray-400">now</span>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-tight">{title || "Notification Title"}</h4>
                      <p className="text-sm text-gray-600 leading-snug mt-1">{message || "Notification message will appear here."}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
