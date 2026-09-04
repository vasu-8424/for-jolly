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
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  short_description: z.string().optional().or(z.literal("")),
  mrp: z.number().min(0, "MRP must be 0 or greater"),
  selling_price: z.number().min(0, "Selling price must be 0 or greater"),
  purchase_price: z.number().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  gst_percentage: z.number().min(0).max(100).optional(),
  category_id: z.string().min(1, "Please select a product category"),
  subcategory_id: z.string().optional().or(z.literal("")),
  brand: z.string().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  stock: z.number().min(0),
  minimum_stock: z.number().min(0),
  weight: z.number().optional(),
  unit: z.string().optional(),
  expiry_date: z.string().optional().or(z.literal("")),
  shelf_life: z.string().optional().or(z.literal("")),
  ingredients: z.string().optional().or(z.literal("")),
  nutrition_info: z.string().optional().or(z.literal("")),
  country_of_origin: z.string().optional(),
  search_tags: z.string().optional().or(z.literal("")),
  labels: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  is_available: z.boolean(),
  is_unique: z.boolean(),
  variants: z.array(z.object({
    weight: z.number().optional(),
    unit: z.string().optional(),
    mrp: z.number().optional(),
    selling_price: z.number().optional(),
    stock: z.number().optional(),
  })).optional(),
  info_fields: z.array(z.object({
    icon: z.string().optional(),
    value: z.string().optional(),
    label: z.string().optional(),
  })).optional(),
  prep_options: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price_adjustment: z.number().optional(),
    is_default: z.boolean().optional(),
  })).optional(),
  extra_options: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    price_adjustment: z.number().optional(),
    is_default: z.boolean().optional(),
  })).optional(),
  recipes: z.array(z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    prep_time: z.string().optional(),
    image_url: z.string().optional(),
  })).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
