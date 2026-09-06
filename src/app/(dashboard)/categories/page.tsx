"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tags, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/shared/data-table";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategories, deleteCategory, toggleCategoryVisibility } from "@/actions/categories";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CategoryData = any;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const res = await toggleCategoryVisibility(id, is_visible);
      if (!res.success) {
        throw new Error(res.error || "Failed to update category visibility");
      }
      return res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.message || "Category visibility updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update category visibility");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteCategory(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete category");
      }
      return res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data?.message || "Category deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete category");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<CategoryData>[] = [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full border border-border flex-shrink-0" 
            style={{ backgroundColor: row.original.color || '#e2e8f0' }} 
          />
          <div className="flex flex-col">
            <span className="font-semibold text-primary">{String(row.getValue("name"))}</span>
            <span className="text-xs text-muted-foreground">/{row.original.slug}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "product_count",
      header: "Products",
      cell: ({ row }) => {
        const count = row.original.product_count ?? 0;
        return (
          <Badge variant="secondary" className="gap-1 font-mono text-xs">
            <Package className="w-3 h-3 text-muted-foreground" />
            {count} {count === 1 ? "product" : "products"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sort_order",
      header: "Sort Order",
    },
    {
      accessorKey: "is_visible",
      header: "Customer Visibility",
      cell: ({ row }) => {
        const isVisible = Boolean(row.getValue("is_visible"));
        const id = row.original.id;
        return (
          <div className="flex items-center gap-2.5">
            <Switch
              checked={isVisible}
              disabled={toggleVisibilityMutation.isPending}
              onCheckedChange={(checked) => {
                toggleVisibilityMutation.mutate({ id, is_visible: checked });
              }}
            />
            <Badge variant={isVisible ? "default" : "outline"} className={isVisible ? "bg-emerald-600 text-white" : "text-amber-600 border-amber-300"}>
              {isVisible ? "Visible" : "Hidden (Cascaded)"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(category);
                setIsOpen(true);
              }}
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(category.id);
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
            <h1 className="text-3xl font-heading font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground mt-2">Manage product categories and hierarchy.</p>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" onClick={() => setEditingCategory(null)}>
              <Plus className="w-4 h-4" />
              Add Category
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{editingCategory ? "Edit Category" : "Add New Category"}</SheetTitle>
                <SheetDescription>
                  {editingCategory ? "Update the category details below." : "Fill in the details to create a new category."}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <CategoryForm 
                  initialData={editingCategory} 
                  onSuccess={() => {
                    setIsOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["categories"] });
                  }} 
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
            <p className="text-muted-foreground animate-pulse">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No Categories Found"
            description="Get started by creating your first product category."
            action={
              <Button className="gap-2" onClick={() => { setEditingCategory(null); setIsOpen(true); }}>
                <Plus className="w-4 h-4" /> Create Category
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={categories} searchKey="name" />
        )}
      </div>
    </PageTransition>
  );
}
