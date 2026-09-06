"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request context
  }
}

export interface BannerRecord {
  id: string;
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  link_target?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getBanners(): Promise<BannerRecord[]> {
  try {
    const supabase = await createAdminClient();

    // 1. Primary: Try fetching from 'banners' table
    const { data: banners, error: bannersErr } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!bannersErr && banners) {
      return banners.map((b: any) => ({
        id: b.id,
        image_url: b.image_url,
        title: b.title || null,
        subtitle: b.subtitle || null,
        link_target: b.link_target || b.deep_link || null,
        display_order: Number(b.display_order ?? b.sort_order ?? 0),
        is_active: b.is_active ?? b.is_visible ?? true,
        created_at: b.created_at,
        updated_at: b.updated_at,
      }));
    }

    // 2. Fallback: Query 'homepage_banners' if 'banners' table is not yet migrated
    const { data: hbData, error: hbErr } = await supabase
      .from("homepage_banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (hbErr) {
      console.error("Error fetching banners from Supabase:", hbErr);
      return [];
    }

    return (hbData || []).map((b: any) => ({
      id: b.id,
      image_url: b.mobile_image_url || b.desktop_image_url || b.image_url,
      title: b.title || null,
      subtitle: null,
      link_target: b.deep_link || null,
      display_order: Number(b.sort_order ?? 0),
      is_active: b.is_visible ?? true,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
  } catch (err) {
    console.error("Failed to get banners:", err);
    return [];
  }
}

export async function createBanner(values: {
  title?: string;
  subtitle?: string;
  image_url: string;
  link_target?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = await createAdminClient();
    const imageUrl = values.image_url.trim();

    const bannerPayload = {
      image_url: imageUrl,
      title: values.title?.trim() || null,
      subtitle: values.subtitle?.trim() || null,
      link_target: values.link_target?.trim() || null,
      display_order: Number(values.display_order) || 0,
      is_active: values.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    // Attempt insert into 'banners'
    let { data, error } = await supabase
      .from("banners")
      .insert([bannerPayload])
      .select()
      .single();

    if (error && (error.code === "PGRST205" || error.message.includes("schema cache"))) {
      // Fallback insert to 'homepage_banners'
      const hbPayload = {
        title: values.title?.trim() || "Promotional Banner",
        desktop_image_url: imageUrl,
        tablet_image_url: imageUrl,
        mobile_image_url: imageUrl,
        deep_link: values.link_target?.trim() || null,
        sort_order: Number(values.display_order) || 0,
        is_visible: values.is_active ?? true,
      };
      const hbRes = await supabase
        .from("homepage_banners")
        .insert([hbPayload])
        .select()
        .single();
      data = hbRes.data;
      error = hbRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/banners");
    safeRevalidatePath("/homepage");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create banner" };
  }
}

export async function updateBanner(
  id: string,
  values: {
    title?: string;
    subtitle?: string;
    image_url?: string;
    link_target?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const supabase = await createAdminClient();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (values.title !== undefined) updates.title = values.title ? values.title.trim() : null;
    if (values.subtitle !== undefined) updates.subtitle = values.subtitle ? values.subtitle.trim() : null;
    if (values.image_url !== undefined) updates.image_url = values.image_url.trim();
    if (values.link_target !== undefined) updates.link_target = values.link_target ? values.link_target.trim() : null;
    if (values.display_order !== undefined) updates.display_order = Number(values.display_order);
    if (values.is_active !== undefined) updates.is_active = values.is_active;

    let { error } = await supabase.from("banners").update(updates).eq("id", id);

    if (error && (error.code === "PGRST205" || error.message.includes("schema cache"))) {
      // Fallback update on 'homepage_banners'
      const hbUpdates: Record<string, any> = {};
      if (values.title !== undefined) hbUpdates.title = values.title || "Promotional Banner";
      if (values.image_url !== undefined) {
        hbUpdates.desktop_image_url = values.image_url;
        hbUpdates.tablet_image_url = values.image_url;
        hbUpdates.mobile_image_url = values.image_url;
      }
      if (values.link_target !== undefined) hbUpdates.deep_link = values.link_target;
      if (values.display_order !== undefined) hbUpdates.sort_order = Number(values.display_order);
      if (values.is_active !== undefined) hbUpdates.is_visible = values.is_active;

      const hbRes = await supabase.from("homepage_banners").update(hbUpdates).eq("id", id);
      error = hbRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/banners");
    safeRevalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update banner" };
  }
}

export async function deleteBanner(id: string) {
  try {
    const supabase = await createAdminClient();
    let { error } = await supabase.from("banners").delete().eq("id", id);

    if (error && (error.code === "PGRST205" || error.message.includes("schema cache"))) {
      const hbRes = await supabase.from("homepage_banners").delete().eq("id", id);
      error = hbRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/banners");
    safeRevalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete banner" };
  }
}

export async function reorderBanners(orderedIds: string[]) {
  try {
    const supabase = await createAdminClient();

    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      await supabase
        .from("banners")
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq("id", id);
      // Also update homepage_banners if exists
      await supabase
        .from("homepage_banners")
        .update({ sort_order: index })
        .eq("id", id);
    }

    safeRevalidatePath("/marketing/banners");
    safeRevalidatePath("/homepage");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to reorder banners" };
  }
}
