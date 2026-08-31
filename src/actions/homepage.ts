"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getHomepageSections() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("homepage_sections")
    .select(`
      *,
      homepage_banners (*)
    `)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching homepage sections:", error);
    return [];
  }
  return data;
}

export async function updateHomepageSection(id: string, updates: any) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("homepage_sections")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/homepage");
  return { success: true };
}

export async function createHomepageSection(values: any) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("homepage_sections")
    .insert([values]);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/homepage");
  return { success: true };
}
