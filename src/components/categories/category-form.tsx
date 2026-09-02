"use client";

import { useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryFormValues } from "@/lib/schemas";
import { createCategory, updateCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/shared/image-upload";

interface CategoryFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      slug: initialData.slug || "",
      image: initialData.image || "",
      icon: initialData.icon || "",
      color: initialData.color || "#10B981",
      sort_order: Number(initialData.sort_order) || 0,
      is_visible: initialData.is_visible ?? true,
    } : {
      name: "",
      slug: "",
      image: "",
      icon: "",
      color: "#10B981",
      sort_order: 0,
      is_visible: true,
    },
  });

  const categoryName = form.watch("name");

  // Auto-generate slug when name changes for new categories
  useEffect(() => {
    if (!initialData && categoryName) {
      const generatedSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      form.setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [categoryName, initialData, form]);

  const onSubmit = (values: CategoryFormValues) => {
    startTransition(async () => {
      let result;
      if (initialData?.id) {
        result = await updateCategory(initialData.id, values);
      } else {
        result = await createCategory(values);
      }

      if (result.success) {
        toast.success(initialData?.id ? "Category updated successfully!" : "Category created successfully!");
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save category");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Fresh Vegetables" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="fresh-vegetables" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] || "")}
                  bucket="categories"
                  maxFiles={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color Hex</FormLabel>
                <FormControl>
                  <Input type="color" className="h-10 px-2 py-1" {...field} value={field.value || "#10B981"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Visibility</FormLabel>
                <FormDescription>
                  Should this category be visible to customers?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
