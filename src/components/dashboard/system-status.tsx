"use client";

import { Database, Server, HardDrive, BellRing, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/layout/stagger-container";

const statuses = [
  { name: "Database", status: "Operational", icon: Database, ping: "12ms" },
  { name: "Realtime", status: "Operational", icon: Activity, ping: "45ms" },
  { name: "Storage", status: "Operational", icon: HardDrive, ping: "28ms" },
  { name: "Notifications", status: "Degraded", icon: BellRing, ping: "140ms" },
];

export function SystemStatus() {
  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold flex items-center gap-2">
          <Server className="w-5 h-5 text-muted-foreground" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StaggerContainer className="space-y-4">
          {statuses.map((sys, idx) => {
            const Icon = sys.icon;
            const isDegraded = sys.status === "Degraded";
            return (
              <StaggerItem key={idx}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{sys.ping}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5">
                        {isDegraded ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning"></span>
                          </>
                        ) : (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                          </>
                        )}
                      </span>
                      <span className="text-xs font-medium">{sys.status}</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </CardContent>
    </Card>
  );
}
