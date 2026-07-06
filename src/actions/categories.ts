"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CategoryFormValues } from "@/lib/schemas";

export async function getCategories() {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert([values])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, data };
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true, data };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}
