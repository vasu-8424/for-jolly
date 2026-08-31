"use client";

import { DollarSign, ShoppingBag, PackageOpen, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/layout/stagger-container";

export function MetricCards({ data }: { data?: { revenue: number; orders: number; pending: number; customers: number } }) {
  const metrics = [
    {
      title: "Delivered Revenue",
      value: `₹${(data?.revenue || 0).toLocaleString()}`,
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Orders",
      value: String(data?.orders || 0),
      change: "+15.4%",
      trend: "up",
      icon: ShoppingBag,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Orders",
      value: String(data?.pending || 0),
      change: "Requires action",
      trend: data && data.pending > 0 ? "up" : "neutral",
      icon: PackageOpen,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Customers",
      value: String(data?.customers || 0),
      change: "+4.1%",
      trend: "up",
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <StaggerItem key={idx}>
            <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-3xl font-heading font-bold text-foreground">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className={`w-4 h-4 mr-1 ${metric.trend === 'up' ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className={metric.trend === 'up' ? 'text-success font-medium' : 'text-muted-foreground'}>
                    {metric.change}
                  </span>
                  <span className="text-muted-foreground ml-1">vs last week</span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
