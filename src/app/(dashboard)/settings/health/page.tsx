"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, DownloadCloud, Activity, Zap } from "lucide-react";

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Health & Backups</h2>
        <p className="text-muted-foreground">Monitor Supabase connection status and export data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> Supabase Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant="success" className="animate-pulse">Connected</Badge>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-medium">Latency</span>
              <span className="text-sm text-muted-foreground">42ms</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" /> Realtime WebSockets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Socket Status</span>
              <Badge variant="success">Active (2 Clients)</Badge>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-medium">Events Today</span>
              <span className="text-sm text-muted-foreground">14,204</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your business settings and product catalog.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div>
              <p className="font-bold">Full Database Backup</p>
              <p className="text-sm text-muted-foreground">Export all tables as SQL dump.</p>
            </div>
            <Button variant="outline" className="gap-2">
              <DownloadCloud className="w-4 h-4" /> Request Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div>
              <p className="font-bold">Export Store Configurations</p>
              <p className="text-sm text-muted-foreground">Download settings as JSON file.</p>
            </div>
            <Button variant="outline" className="gap-2">
              <DownloadCloud className="w-4 h-4" /> Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
