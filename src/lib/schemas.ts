import * as z from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  image: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_visible: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().min(3, "Product name is required"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  mrp: z.coerce.number().positive("MRP must be greater than 0"),
  selling_price: z.coerce.number().positive("Selling price must be greater than 0"),
  purchase_price: z.coerce.number().optional(),
  discount_percentage: z.coerce.number().min(0).max(100).default(0),
  gst_percentage: z.coerce.number().min(0).max(100).default(0),
  category_id: z.string().uuid("Please select a valid category"),
  subcategory_id: z.string().uuid().optional().or(z.literal("")),
  brand: z.string().optional(),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  minimum_stock: z.coerce.number().int().min(0).default(5),
  weight: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  expiry_date: z.string().optional(),
  shelf_life: z.string().optional(),
  ingredients: z.string().optional(),
  nutrition_info: z.string().optional(),
  country_of_origin: z.string().default("India"),
  search_tags: z.string().optional(), // Will be transformed to array
  labels: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  is_available: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;
