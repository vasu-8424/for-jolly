"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Smartphone, CheckCircle, AlertCircle, Loader2, History } from "lucide-react";
import { useState } from "react";
import { sendBroadcastNotification, getNotifications } from "@/actions/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("Big Monsoon Sale!");
  const [message, setMessage] = useState("Get flat 50% off on all fresh fruits. Valid till midnight.");
  const [deepLink, setDeepLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: notifications = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const handleDispatch = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Please enter both a title and message body." });
      toast.error("Please enter both a title and message body.");
      return;
    }

    setIsSending(true);
    setStatus(null);

    const res = await sendBroadcastNotification({
      title: title.trim(),
      body: message.trim(),
      deep_link: deepLink.trim(),
      image_url: imageUrl.trim(),
      target_audience: targetAudience,
    });

    setIsSending(false);

    if (res.success) {
      setStatus({ type: "success", text: res.message || "Push notification broadcast dispatched successfully to all app users!" });
      toast.success("Push notification broadcast dispatched successfully!");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } else {
      const errMsg = (res as any).error || res.message || "Failed to dispatch notification.";
      setStatus({ type: "error", text: errMsg });
      toast.error(errMsg);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 pb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Push Notifications</h1>
            <p className="text-muted-foreground mt-2">Send broadcast messages directly to all mobile app users.</p>
          </div>
          <Button 
            onClick={handleDispatch}
            disabled={isSending}
            className="gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? "Dispatching..." : "Dispatch Now"}
          </Button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            status.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {status.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{status.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Notification Builder</CardTitle>
              <CardDescription>Compose your broadcast push payload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select value={targetAudience} onValueChange={(val) => setTargetAudience(val || "all")}>
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
                <label className="text-sm font-medium">Banner Image URL (Optional)</label>
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/banner.jpg" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deep Link (Optional)</label>
                <Input value={deepLink} onChange={e => setDeepLink(e.target.value)} placeholder="E.g., /flash-sale or /category/fruits" />
                <p className="text-xs text-muted-foreground">App will open directly to this screen.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center items-start lg:mt-4">
            <div className="relative w-[320px] h-[580px] bg-black rounded-[3rem] border-8 border-black shadow-2xl overflow-hidden flex flex-col pt-12">
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
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-4 border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kakinada Fresh</span>
                        <span className="text-xs text-gray-400">now</span>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-tight truncate">{title || "Notification Title"}</h4>
                      <p className="text-xs text-gray-600 leading-snug mt-1 line-clamp-2">{message || "Notification message will appear here."}</p>
                      {imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border">
                          <img src={imageUrl} alt="Notification preview" className="w-full h-20 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification History */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <CardTitle>Dispatched History</CardTitle>
            </div>
            <CardDescription>Recent push notification broadcasts.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Loading history...
              </div>
            ) : notifications.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                No notifications dispatched yet.
              </div>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden">
                {notifications.map((notif: any) => (
                  <div key={notif.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{notif.title}</span>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          {notif.status || "Sent"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {notif.type || "Broadcast"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{notif.message}</p>
                      {notif.deep_link && (
                        <p className="text-xs text-blue-600">Link: {notif.deep_link}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                      {notif.created_at ? format(new Date(notif.created_at), "dd MMM yyyy, hh:mm a") : "Recent"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
