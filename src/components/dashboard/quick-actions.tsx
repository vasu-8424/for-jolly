"use client";

import { PlusCircle, Tag, Image as ImageIcon, BellRing, ShoppingCart, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StaggerContainer, StaggerItem } from "@/components/layout/stagger-container";
import Link from "next/link";

const actions = [
  { name: "Add Product", icon: PlusCircle, color: "text-blue-500", bg: "bg-blue-500/10", href: "/products/new" },
  { name: "Create Coupon", icon: Tag, color: "text-purple-500", bg: "bg-purple-500/10", href: "/marketing/coupons" },
  { name: "Upload Banner", icon: ImageIcon, color: "text-pink-500", bg: "bg-pink-500/10", href: "/marketing/banners" },
  { name: "Send Alert", icon: BellRing, color: "text-orange-500", bg: "bg-orange-500/10", href: "/feature-flags" },
  { name: "View Orders", icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10", href: "/orders" },
  { name: "Edit Homepage", icon: Layout, color: "text-teal-500", bg: "bg-teal-500/10", href: "/homepage" },
];

export function QuickActions() {
  return (
    <Card className="border-none shadow-md bg-card/80 backdrop-blur-xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <StaggerItem key={i}>
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full h-24 flex flex-col items-center justify-center gap-2 border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all shadow-sm hover:shadow-md"
                >
                  <Link href={action.href}>
                    <div className={`p-2 rounded-full ${action.bg}`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.name}</span>
                  </Link>
                </Button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </CardContent>
    </Card>
  );
}
