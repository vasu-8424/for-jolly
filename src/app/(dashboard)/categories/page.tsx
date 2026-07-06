"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { PageTransition } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategories, deleteCategory } from "@/actions/categories";
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

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
            className="w-8 h-8 rounded-full border border-border" 
            style={{ backgroundColor: row.original.color || '#e2e8f0' }} 
          />
          <span className="font-medium">{String(row.getValue("name"))}</span>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "sort_order",
      header: "Sort Order",
    },
    {
      accessorKey: "is_visible",
      header: "Visibility",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_visible") ? "default" : "secondary"}>
          {row.getValue("is_visible") ? "Visible" : "Hidden"}
        </Badge>
      ),
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
