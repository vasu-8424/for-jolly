"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "@/lib/schemas";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data;
}

export async function createProduct(values: ProductFormValues) {
  const supabase = await createClient();
  const { images, ...productData } = values;

  // Insert the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([
      {
        ...productData,
        subcategory_id: productData.subcategory_id === "" ? null : productData.subcategory_id,
        search_tags: productData.search_tags ? productData.search_tags.split(",").map(t => t.trim()) : [],
      }
    ])
    .select()
    .single();

  if (productError) {
    return { success: false, error: productError.message };
  }

  // Insert images if any exist
  if (images && images.length > 0) {
    const imageInserts = images.map((url, idx) => ({
      product_id: product.id,
      image_url: url,
      is_thumbnail: idx === 0,
      display_order: idx
    }));

    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imageInserts);

    if (imageError) {
      console.error("Error inserting images:", imageError);
      // We don't fail the whole product creation if images fail, but we log it
    }
  }

  revalidatePath("/products");
  return { success: true, data: product };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (image_url, is_thumbnail, display_order)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  // Format images array for the form
  if (data && data.product_images) {
    data.images = data.product_images
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => img.image_url);
  } else {
    data.images = [];
  }

  return data;
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const supabase = await createClient();
  const { images, ...productData } = values;

  // Update the product
  const { error: productError } = await supabase
    .from("products")
    .update({
      ...productData,
      subcategory_id: productData.subcategory_id === "" ? null : productData.subcategory_id,
      search_tags: productData.search_tags && typeof productData.search_tags === "string" 
        ? productData.search_tags.split(",").map((t: string) => t.trim()) 
        : productData.search_tags,
    })
    .eq("id", id);

  if (productError) {
    return { success: false, error: productError.message };
  }

  // Handle images: delete old and insert new
  await supabase.from("product_images").delete().eq("product_id", id);
  
  if (images && images.length > 0) {
    const imageInserts = images.map((url, idx) => ({
      product_id: id,
      image_url: url,
      is_thumbnail: idx === 0,
      display_order: idx
    }));

    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imageInserts);

    if (imageError) {
      console.error("Error updating images:", imageError);
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}
