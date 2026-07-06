"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  Home, 
  Image as ImageIcon, 
  Ticket, 
  Bell, 
  BarChart, 
  FileText, 
  Database, 
  Settings, 
  User, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Categories", href: "/categories", icon: Tags },
    ]
  },
  {
    title: "Sales & Users",
    items: [
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "Customers", href: "/customers", icon: Users },
    ]
  },
  {
    title: "Content & Marketing",
    items: [
      { name: "Homepage Builder", href: "/homepage", icon: Home },
      { name: "Banner Manager", href: "/marketing/banners", icon: ImageIcon },
      { name: "Coupons", href: "/marketing/coupons", icon: Ticket },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart },
      { name: "Reports", href: "/analytics/reports", icon: FileText },
      { name: "CMS", href: "/cms", icon: Database },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card flex-shrink-0 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-heading font-bold text-primary">Kakinada Fresh</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups.map((group, i) => (
          <div key={i} className="space-y-1">
            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {group.title}
            </h4>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} prefetch={false} className="block">
                  <span
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        <Link href="/profile" className="block">
          <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <User className="w-4 h-4" />
            Profile
          </span>
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
