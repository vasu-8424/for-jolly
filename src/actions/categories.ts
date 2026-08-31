"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { CategoryFormValues } from "@/lib/schemas";

export async function getCategories() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data;
}

export async function createCategory(values: CategoryFormValues) {
  const supabase = await createAdminClient();
  
  const baseSlug = values.slug?.trim() || values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const slug = baseSlug || `cat-${Date.now().toString().slice(-4)}`;

  const payload = {
    ...values,
    slug,
  };

  const { data, error } = await supabase
    .from("categories")
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.message.includes("categories_name_key")) {
      return { success: false, error: "A category with this name already exists." };
    }
    if (error.message.includes("categories_slug_key")) {
      return { success: false, error: "A category with this slug already exists. Please choose a unique slug." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, data };
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const supabase = await createAdminClient();

  const baseSlug = values.slug?.trim() || values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const slug = baseSlug || `cat-${Date.now().toString().slice(-4)}`;

  const payload = {
    ...values,
    slug,
  };

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.message.includes("categories_name_key")) {
      return { success: false, error: "A category with this name already exists." };
    }
    if (error.message.includes("categories_slug_key")) {
      return { success: false, error: "A category with this slug already exists. Please choose a unique slug." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, data };
}

export async function deleteCategory(id: string) {
  const supabase = await createAdminClient();

  // 1. Check if any products are assigned to this category
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("category_id", id)
    .limit(5);

  if (products && products.length > 0) {
    const productNames = products.map((p) => p.name).join(", ");
    return {
      success: false,
      error: `Cannot delete this category because products are assigned to it (${productNames}). Please delete or reassign those products first.`
    };
  }

  // 2. Clean up associated subcategories if any
  await supabase.from("subcategories").delete().eq("category_id", id);

  // 3. Delete category
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, message: "Category deleted successfully" };
}
