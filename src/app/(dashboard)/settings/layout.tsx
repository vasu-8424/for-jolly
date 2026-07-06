"use client";

import { Building2, Store, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/layout/page-transition";

const settingsNav = [
  { title: "Business Profile", href: "/settings", icon: Building2 },
  { title: "Store & Delivery", href: "/settings/store", icon: Store },
  { title: "Payment Methods", href: "/settings/payments", icon: CreditCard },
  { title: "System Health", href: "/settings/health", icon: ShieldCheck },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your global store configurations and system preferences.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 pt-4">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
              {settingsNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </aside>
          
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
