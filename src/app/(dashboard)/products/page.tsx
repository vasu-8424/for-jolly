"use client";

import { Plus, Pencil, Trash2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { getProducts, deleteProduct } from "@/actions/products";
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
      cell: ({ row }) => (
        <span className="text-sm">{row.original.categories?.name || "Uncategorized"}</span>
      )
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => <span className="font-medium">₹{row.getValue("selling_price")}</span>
    },
    {
      accessorKey: "stock",
      header: "Inventory",
      cell: ({ row }) => {
        const stock = Number(row.getValue("stock"));
        const minStock = Number(row.original.minimum_stock);
        return (
          <Badge variant={stock === 0 ? "destructive" : stock <= minStock ? "warning" : "secondary"}>
            {stock} in stock
          </Badge>
        );
      }
    },
    {
      accessorKey: "is_available",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_available") ? "default" : "outline"}>
          {row.getValue("is_available") ? "Active" : "Hidden"}
        </Badge>
      ),
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
