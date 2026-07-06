"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, Package, Tags, Ticket, LayoutTemplate, Users, ShoppingCart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

import { globalSearch } from "@/actions/search";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ products: any[], customers: any[], orders: any[] }>({ products: [], customers: [], orders: [] });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!query || query.length < 2) {
        setResults({ products: [], customers: [], orders: [] });
        return;
      }
      setIsLoading(true);
      const data = await globalSearch(query);
      setResults(data);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search products, orders, customers...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." value={query} onValueChange={setQuery} />
        <CommandList>
          {query.length > 0 && isLoading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>
          ) : query.length > 0 && results.products.length === 0 && results.customers.length === 0 && results.orders.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : null}
          
          {results.products.length > 0 && (
            <CommandGroup heading="Products">
              {results.products.map(p => (
                <CommandItem key={p.id} onSelect={() => runCommand(() => router.push(`/products/${p.id}`))}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.customers.length > 0 && (
            <CommandGroup heading="Customers">
              {results.customers.map(c => (
                <CommandItem key={c.id} onSelect={() => runCommand(() => router.push(`/customers/${c.id}`))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{c.full_name || c.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.orders.length > 0 && (
            <CommandGroup heading="Orders">
              {results.orders.map(o => (
                <CommandItem key={o.id} onSelect={() => runCommand(() => router.push(`/orders/${o.id}`))}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Order #{o.id.substring(0, 8).toUpperCase()} - {o.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!query && (
            <>
              <CommandGroup heading="Quick Links">
                <CommandItem onSelect={() => runCommand(() => router.push("/products/new"))}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Create Product</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/orders"))}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>View Orders</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/customers"))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Customers</span>
                </CommandItem>
              </CommandGroup>
              
              <CommandGroup heading="Modules">
                <CommandItem onSelect={() => runCommand(() => router.push("/products"))}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Products Catalog</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/categories"))}>
                  <Tags className="mr-2 h-4 w-4" />
                  <span>Categories</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/marketing/coupons"))}>
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>Coupons & Offers</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/marketing/banners"))}>
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  <span>Marketing & Banners</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Business Settings</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
