"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ==========================================
// HOMEPAGE SECTIONS ACTIONS
// ==========================================

export async function getHomepageSections() {
  try {
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

    return (data || []).map((section: any) => ({
      ...section,
      banners: (section.homepage_banners || []).map((b: any) => ({
        ...b,
        image_url: b.mobile_image_url || b.desktop_image_url || b.image_url,
      }))
    }));
  } catch (err) {
    console.error("Failed to fetch homepage sections:", err);
    return [];
  }
}

export async function createHomepageSection(values: {
  title: string;
  type: string;
  sort_order?: number;
  is_visible?: boolean;
  background_color?: string;
  data_config?: any;
}) {
  try {
    const supabase = await createAdminClient();

    // 1. Strict Backend Validation: Title
    const title = values.title?.trim();
    if (!title || title.length < 2) {
      return { success: false, error: "Section title is required and must be at least 2 characters." };
    }

    // 2. Strict Backend Validation: Category ID
    const categoryId = values.data_config?.category_id;
    if (!categoryId || typeof categoryId !== "string" || categoryId.trim().length === 0 || categoryId === "all") {
      return { 
        success: false, 
        error: "A valid category_id is strictly required for homepage sections to prevent product mixing. Please select a specific category." 
      };
    }

    // 3. Verify category existence in database
    const { data: categoryExists, error: catCheckError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", categoryId.trim())
      .single();

    if (catCheckError || !categoryExists) {
      return { 
        success: false, 
        error: `Category ID "${categoryId}" does not exist in the database. Please select a valid category.` 
      };
    }

    const payload = {
      title,
      type: values.type || "Collection",
      sort_order: Number(values.sort_order) || 0,
      is_visible: values.is_visible ?? true,
      background_color: values.background_color || "#ffffff",
      data_config: {
        category_id: categoryExists.id,
        limit: Number(values.data_config?.limit) || 10,
      },
    };

    const { data, error } = await supabase
      .from("homepage_sections")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/homepage");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create homepage section" };
  }
}

export async function updateHomepageSection(id: string, updates: any) {
  try {
    const supabase = await createAdminClient();

    // Strict Backend Validation if title is being updated
    if (updates.title !== undefined) {
      const title = String(updates.title).trim();
      if (!title || title.length < 2) {
        return { success: false, error: "Section title must be at least 2 characters." };
      }
      updates.title = title;
    }

    // Strict Backend Validation if data_config or category_id is being updated
    if (updates.data_config !== undefined) {
      const categoryId = updates.data_config?.category_id;
      if (!categoryId || typeof categoryId !== "string" || categoryId.trim().length === 0 || categoryId === "all") {
        return { 
          success: false, 
          error: "A valid category_id is strictly required for homepage sections to prevent product mixing. Please select a specific category." 
        };
      }

      // Verify category existence in database
      const { data: categoryExists, error: catCheckError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId.trim())
        .single();

      if (catCheckError || !categoryExists) {
        return { 
          success: false, 
          error: `Category ID "${categoryId}" does not exist in the database.` 
        };
      }

      updates.data_config = {
        category_id: categoryExists.id,
        limit: Number(updates.data_config?.limit) || 10,
      };
    }

    const { error } = await supabase
      .from("homepage_sections")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update section" };
  }
}

export async function deleteHomepageSection(id: string) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("homepage_sections")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete section" };
  }
}

// ==========================================
// BANNER MANAGEMENT ACTIONS
// ==========================================

export async function getBanners() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("homepage_banners")
      .select(`
        *,
        homepage_sections (id, title, type)
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching banners:", error);
      return [];
    }

    return (data || []).map((b: any) => ({
      ...b,
      image_url: b.mobile_image_url || b.desktop_image_url || b.image_url,
    }));
  } catch (err) {
    console.error("Failed to fetch banners:", err);
    return [];
  }
}

export async function createBanner(values: {
  title?: string;
  image_url: string;
  deep_link?: string;
  sort_order?: number;
  is_visible?: boolean;
  section_id?: string | null;
}) {
  try {
    const supabase = await createAdminClient();
    const imageUrl = values.image_url.trim();

    const payload = {
      title: values.title?.trim() || "Promotional Banner",
      desktop_image_url: imageUrl,
      tablet_image_url: imageUrl,
      mobile_image_url: imageUrl,
      deep_link: values.deep_link?.trim() || null,
      sort_order: Number(values.sort_order) || 0,
      is_visible: values.is_visible ?? true,
      section_id: values.section_id || null,
    };

    const { data, error } = await supabase
      .from("homepage_banners")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/marketing/banners");
    revalidatePath("/homepage");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create banner" };
  }
}

export async function updateBanner(id: string, values: {
  title?: string;
  image_url?: string;
  deep_link?: string;
  sort_order?: number;
  is_visible?: boolean;
  section_id?: string | null;
}) {
  try {
    const supabase = await createAdminClient();
    const updates: Record<string, any> = {};

    if (values.title !== undefined) updates.title = values.title.trim();
    if (values.image_url !== undefined) {
      const url = values.image_url.trim();
      updates.desktop_image_url = url;
      updates.tablet_image_url = url;
      updates.mobile_image_url = url;
    }
    if (values.deep_link !== undefined) updates.deep_link = values.deep_link.trim() || null;
    if (values.sort_order !== undefined) updates.sort_order = Number(values.sort_order);
    if (values.is_visible !== undefined) updates.is_visible = values.is_visible;
    if (values.section_id !== undefined) updates.section_id = values.section_id || null;

    const { error } = await supabase
      .from("homepage_banners")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/marketing/banners");
    revalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update banner" };
  }
}

export async function deleteBanner(id: string) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("homepage_banners")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/marketing/banners");
    revalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete banner" };
  }
}
