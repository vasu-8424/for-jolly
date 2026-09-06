"use client";

import { Plus, Pencil, Trash2, PackageOpen, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/shared/data-table";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { getProducts, deleteProduct, toggleProductOutOfStock } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductData = any;

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const toggleOutOfStockMutation = useMutation({
    mutationFn: async ({ id, force_out_of_stock }: { id: string; force_out_of_stock: boolean }) => {
      const res = await toggleProductOutOfStock(id, force_out_of_stock);
      if (!res.success) {
        throw new Error(res.error || "Failed to update stock status");
      }
      return res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.message || "Product stock status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update stock status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteProduct(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete product");
      }
      return res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.message || "Product deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<ProductData>[] = [
    {
      accessorKey: "name",
      header: "Product Details",
      cell: ({ row }) => {
        const images = row.original.product_images || [];
        const thumb = images.find((i: any) => i.is_thumbnail)?.image_url || images[0]?.image_url;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted border overflow-hidden flex-shrink-0 flex items-center justify-center">
              {thumb ? (
                <img src={thumb} alt={row.getValue("name")} className="w-full h-full object-cover" />
              ) : (
                <PackageOpen className="w-5 h-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-primary">{row.getValue("name")}</span>
              <span className="text-xs text-muted-foreground">SKU: {row.original.sku || "N/A"}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "categories.name",
      header: "Category",
      cell: ({ row }) => {
        const cat = row.original.categories;
        const isCatVisible = cat ? cat.is_visible !== false : true;
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-sm font-medium">{cat?.name || "Uncategorized"}</span>
            {!isCatVisible && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400">
                Category Hidden
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => <span className="font-medium">₹{row.getValue("selling_price")}</span>
    },
    {
      accessorKey: "stock",
      header: "Inventory Status",
      cell: ({ row }) => {
        const stock = Number(row.getValue("stock") ?? 0);
        const minStock = Number(row.original.minimum_stock ?? 5);
        const isForceOos = row.original.force_out_of_stock === true;
        const isEffectiveOos = isForceOos || stock <= 0;

        if (isEffectiveOos) {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge variant="destructive" className="bg-red-600 text-white font-semibold">
                Out of Stock
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                {isForceOos ? "Manual Override" : "0 Units Left"}
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-0.5 items-start">
            <Badge variant={stock <= minStock ? "warning" : "secondary"}>
              {stock} in stock
            </Badge>
            {stock <= minStock && (
              <span className="text-[10px] text-amber-600 font-medium">Low Stock</span>
            )}
          </div>
        );
      }
    },
    {
      id: "force_out_of_stock",
      header: "Force Out of Stock",
      cell: ({ row }) => {
        const product = row.original;
        const isForceOos = product.force_out_of_stock === true;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isForceOos}
              disabled={toggleOutOfStockMutation.isPending}
              onCheckedChange={(checked) => {
                toggleOutOfStockMutation.mutate({
                  id: product.id,
                  force_out_of_stock: checked,
                });
              }}
            />
            <span className="text-xs text-muted-foreground">
              {isForceOos ? "Forced OOS" : "Auto"}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "is_available",
      header: "App Visibility",
      cell: ({ row }) => {
        const isAvailable = Boolean(row.getValue("is_available"));
        const isCatVisible = row.original.categories ? row.original.categories.is_visible !== false : true;
        
        if (!isAvailable) {
          return <Badge variant="outline" className="text-muted-foreground">Product Inactive</Badge>;
        }
        if (!isCatVisible) {
          return (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-400">
              Hidden (by Category)
            </Badge>
          );
        }
        return <Badge variant="default" className="bg-emerald-600 text-white">Live on App</Badge>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/products/${product.id}`}>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product.id);
              }}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your entire product catalog.</p>
          </div>
          
          <Button asChild className="gap-2 shadow-md">
            <Link href="/products/new">
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
            <p className="text-muted-foreground animate-pulse">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No Products Found"
            description="Your catalog is currently empty. Start adding products to populate your store."
            action={
              <Button asChild className="gap-2">
                <Link href="/products/new">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={products} searchKey="name" />
        )}
      </div>
    </PageTransition>
  );
}
