import * as z from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  image: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number(),
  is_visible: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().min(3, "Product name is required"),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  short_description: z.string().optional(),
  mrp: z.number().min(0, "MRP must be 0 or greater"),
  selling_price: z.number().min(0, "Selling price must be 0 or greater"),
  purchase_price: z.number().optional(),
  discount_percentage: z.number().min(0).max(100),
  gst_percentage: z.number().min(0).max(100),
  category_id: z.string().min(1, "Please select a category"),
  subcategory_id: z.string().optional().or(z.literal("")),
  brand: z.string().optional(),
  sku: z.string().optional().or(z.literal("")),
  barcode: z.string().optional(),
  stock: z.number().min(0),
  minimum_stock: z.number().min(0),
  weight: z.number().min(0).optional(),
  unit: z.string().optional(),
  expiry_date: z.string().optional(),
  shelf_life: z.string().optional(),
  ingredients: z.string().optional(),
  nutrition_info: z.string().optional(),
  country_of_origin: z.string(),
  search_tags: z.string().optional(),
  labels: z.array(z.string()),
  images: z.array(z.string()),
  is_available: z.boolean(),
  is_unique: z.boolean(),
  variants: z.array(z.object({
    weight: z.number().min(0, "Weight cannot be negative"),
    unit: z.string().min(1, "Unit is required"),
    mrp: z.number().min(0, "MRP cannot be negative"),
    selling_price: z.number().min(0, "Selling price cannot be negative"),
    stock: z.number().min(0, "Stock cannot be negative"),
  })),
});

export type ProductFormValues = z.infer<typeof productSchema>;


