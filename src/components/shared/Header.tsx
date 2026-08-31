"use client";

import { Bell, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/shared/command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRealtimeStatus } from "@/providers/realtime-provider";
import { logout } from "@/app/(auth)/login/actions";
import Link from "next/link";

export function Header() {
  const { setTheme, theme } = useTheme();
  const pathname = usePathname();
  const { isConnected } = useRealtimeStatus();

  // Basic breadcrumbs generation
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentPath = pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + pathSegments[pathSegments.length - 1].slice(1)
    : "Dashboard";

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <CommandPalette />
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block">
          Admin / <span className="text-foreground">{currentPath}</span>
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border/60 bg-card/50">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-muted-foreground font-medium text-[11px]">
            {isConnected ? "Live Sync" : "Syncing"}
          </span>
        </div>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/90 backdrop-blur-md">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full border border-border p-0 overflow-hidden outline-none hover:ring-2 ring-primary/20 transition-all">
            <div className="w-full h-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-primary">
              A
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card/90 backdrop-blur-md" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@kakinadafresh.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile" className="w-full">
              <DropdownMenuItem className="cursor-pointer">
                Profile Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem 
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
