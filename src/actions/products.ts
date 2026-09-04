"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "@/lib/schemas";

export async function getProducts() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (name),
      product_images (image_url, is_thumbnail, display_order)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Filter out any deleted/archived products so they are completely removed from the catalog view
  return (data || []).filter(
    (p: any) => !(Array.isArray(p.labels) && p.labels.includes("Archived"))
  );
}

export async function createProduct(values: ProductFormValues) {
  const supabase = await createAdminClient();
  const { images, is_unique, variants, ...productData } = values;

  const baseSlug = productData.slug?.trim() || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const rawSku = productData.sku?.trim();
  const sku = rawSku && rawSku.length > 0 ? rawSku : null;

  const rawBarcode = productData.barcode?.trim();
  const barcode = rawBarcode && rawBarcode.length > 0 ? rawBarcode : null;

  const rawExpiry = productData.expiry_date?.trim();
  const expiry_date = rawExpiry && rawExpiry.length > 0 ? rawExpiry : null;

  const rawSubcat = productData.subcategory_id?.trim();
  const subcategory_id = rawSubcat && rawSubcat.length > 0 ? rawSubcat : null;

  const rawBrand = productData.brand?.trim();
  const brand = rawBrand && rawBrand.length > 0 ? rawBrand : null;

  const rawPurchasePrice = productData.purchase_price;
  const purchase_price = rawPurchasePrice && Number(rawPurchasePrice) > 0 ? Number(rawPurchasePrice) : null;

  let labels = productData.labels || [];
  if (is_unique) {
    if (!labels.includes("Unique")) {
      labels = [...labels, "Unique"];
    }
  } else {
    labels = labels.filter((l: string) => l !== "Unique");
  }

  const search_tags = typeof productData.search_tags === "string" && productData.search_tags 
    ? productData.search_tags.split(",").map((t: string) => t.trim()).filter(Boolean) 
    : (Array.isArray(productData.search_tags) ? productData.search_tags : []);

  const insertPayload = {
    name: productData.name.trim(),
    slug,
    category_id: productData.category_id,
    subcategory_id,
    description: productData.description || null,
    short_description: productData.short_description || null,
    mrp: Number(productData.mrp) || 0,
    selling_price: Number(productData.selling_price) || 0,
    purchase_price,
    discount_percentage: Number(productData.discount_percentage) || 0,
    gst_percentage: Number(productData.gst_percentage) || 0,
    brand,
    sku,
    barcode,
    stock: Number(productData.stock) || 0,
    minimum_stock: Number(productData.minimum_stock) || 0,
    weight: Number(productData.weight) || 1,
    unit: productData.unit || "kg",
    expiry_date,
    shelf_life: productData.shelf_life || null,
    ingredients: productData.ingredients || null,
    nutrition_info: productData.nutrition_info || null,
    country_of_origin: productData.country_of_origin || "India",
    search_tags,
    labels,
    is_available: productData.is_available ?? true,
    info_fields: productData.info_fields || [],
    prep_options: productData.prep_options || [],
    extra_options: productData.extra_options || [],
    recipes: productData.recipes || [],
  };

  // Insert the product
  let { data: product, error: productError } = await supabase
    .from("products")
    .insert([insertPayload])
    .select()
    .single();

  if (productError && (productError.code === "PGRST204" || productError.message.includes("schema cache") || productError.message.includes("column"))) {
    // If structured fields columns don't exist yet in Supabase, retry without them
    const { info_fields, prep_options, extra_options, recipes, ...basePayload } = insertPayload;
    const retry = await supabase
      .from("products")
      .insert([basePayload])
      .select()
      .single();
    if (!retry.error) {
      product = retry.data;
      productError = null;
    }
  }

  if (productError) {
    if (productError.message.includes("products_sku_key")) {
      return { success: false, error: "A product with this SKU already exists. Please leave the SKU field blank or enter a unique SKU." };
    }
    if (productError.message.includes("products_barcode_key")) {
      return { success: false, error: "A product with this barcode already exists. Please leave the barcode field blank or enter a unique barcode." };
    }
    if (productError.message.includes("products_slug_key")) {
      return { success: false, error: "A product with this URL slug already exists. Please change the product name." };
    }
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
    }
  }

  // Insert variants if any exist
  if (variants && variants.length > 0) {
    const variantInserts = variants.map((v) => ({
      product_id: product.id,
      name: `${v.weight ?? 0} ${v.unit ?? "gms"}`,
      weight: Number(v.weight) || 0,
      unit: v.unit || "gms",
      mrp: Number(v.mrp) || 0,
      selling_price: Number(v.selling_price) || 0,
      stock: Number(v.stock) || 0,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantInserts);

    if (variantError) {
      console.error("Error inserting variants:", variantError);
    }
  }

  revalidatePath("/products");
  return { success: true, data: product };
}

export async function deleteProduct(id: string) {
  const supabase = await createAdminClient();

  // 1. Check if product is part of any active/in-progress orders
  const { data: activeOrderItems, error: activeErr } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      orders!inner (
        id,
        order_number,
        status
      )
    `)
    .eq("product_id", id)
    .in("orders.status", ["Pending", "Preparing", "Packed", "Out For Delivery"]);

  if (!activeErr && activeOrderItems && activeOrderItems.length > 0) {
    const orderNums = activeOrderItems
      .map((item: any) => item.orders?.order_number || `#${String(item.order_id).substring(0, 8)}`)
      .slice(0, 3)
      .join(", ");

    return {
      success: false,
      error: `Cannot delete this product because it is in active order(s) currently in progress (${orderNums}). Please complete or cancel these orders first.`
    };
  }

  // 2. Clean up related dependent records
  await supabase.from("product_images").delete().eq("product_id", id);
  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("product_label_relations").delete().eq("product_id", id);
  await supabase.from("inventory_history").delete().eq("product_id", id);
  await supabase.from("reviews").delete().eq("product_id", id);

  // 3. Delete the product
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    // If PostgreSQL blocked deletion because of historical customer orders in order_items:
    if (error.message.includes("order_items_product_id_fkey") || error.code === "23503") {
      // Archive the product: marks as archived, clears stock and frees up SKU & Barcode for reuse
      const { error: archiveError } = await supabase
        .from("products")
        .update({
          is_available: false,
          stock: 0,
          labels: ["Archived"],
          sku: null,
          barcode: null,
        })
        .eq("id", id);

      if (archiveError) {
        return { success: false, error: archiveError.message };
      }

      revalidatePath("/products");
      return { success: true, message: "Product deleted successfully from catalog." };
    }

    console.error("Error deleting product:", error);
    return { success: false, error: `Could not delete product: ${error.message}` };
  }

  revalidatePath("/products");
  return { success: true, message: "Product deleted successfully from catalog." };
}

export async function getProductById(id: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (image_url, is_thumbnail, display_order),
      product_variants (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  if (data) {
    data.is_unique = (Array.isArray(data.labels) && data.labels.includes("Unique")) || data.is_unique === true;
  }

  // Format images array for the form
  if (data && data.product_images) {
    data.images = data.product_images
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => img.image_url);
  } else {
    data.images = [];
  }

  // Format variants array for the form
  if (data && data.product_variants && data.product_variants.length > 0) {
    data.variants = data.product_variants.map((v: any) => ({
      weight: Number(v.weight ?? 0),
      unit: v.unit || "gms",
      mrp: Number(v.mrp ?? 0),
      selling_price: Number(v.selling_price ?? 0),
      stock: Number(v.stock ?? 0),
    }));
  } else {
    data.variants = [];
  }

  data.info_fields = Array.isArray(data.info_fields) ? data.info_fields : [];
  data.prep_options = Array.isArray(data.prep_options) ? data.prep_options : [];
  data.extra_options = Array.isArray(data.extra_options) ? data.extra_options : [];
  data.recipes = Array.isArray(data.recipes) ? data.recipes : [];

  return data;
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const supabase = await createAdminClient();
  const { images, is_unique, variants, ...productData } = values;

  let labels = productData.labels || [];
  if (is_unique) {
    if (!labels.includes("Unique")) {
      labels = [...labels, "Unique"];
    }
  } else {
    labels = labels.filter((l: string) => l !== "Unique");
  }

  const rawSku = productData.sku?.trim();
  const sku = rawSku && rawSku.length > 0 ? rawSku : null;

  const rawBarcode = productData.barcode?.trim();
  const barcode = rawBarcode && rawBarcode.length > 0 ? rawBarcode : null;

  const rawExpiry = productData.expiry_date?.trim();
  const expiry_date = rawExpiry && rawExpiry.length > 0 ? rawExpiry : null;

  const rawSubcat = productData.subcategory_id?.trim();
  const subcategory_id = rawSubcat && rawSubcat.length > 0 ? rawSubcat : null;

  const rawBrand = productData.brand?.trim();
  const brand = rawBrand && rawBrand.length > 0 ? rawBrand : null;

  const rawPurchasePrice = productData.purchase_price;
  const purchase_price = rawPurchasePrice && Number(rawPurchasePrice) > 0 ? Number(rawPurchasePrice) : null;

  const search_tags = typeof productData.search_tags === "string" && productData.search_tags
    ? productData.search_tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : (Array.isArray(productData.search_tags) ? productData.search_tags : []);

  // Build clean sanitized update payload
  const updatePayload: Record<string, any> = {
    name: productData.name.trim(),
    category_id: productData.category_id,
    subcategory_id,
    description: productData.description || null,
    short_description: productData.short_description || null,
    mrp: Number(productData.mrp) || 0,
    selling_price: Number(productData.selling_price) || 0,
    purchase_price,
    discount_percentage: Number(productData.discount_percentage) || 0,
    gst_percentage: Number(productData.gst_percentage) || 0,
    brand,
    sku,
    barcode,
    stock: Number(productData.stock) || 0,
    minimum_stock: Number(productData.minimum_stock) || 0,
    weight: Number(productData.weight) || 1,
    unit: productData.unit || "kg",
    expiry_date,
    shelf_life: productData.shelf_life || null,
    ingredients: productData.ingredients || null,
    nutrition_info: productData.nutrition_info || null,
    country_of_origin: productData.country_of_origin || "India",
    search_tags,
    labels,
    is_available: productData.is_available ?? true,
    info_fields: productData.info_fields || [],
    prep_options: productData.prep_options || [],
    extra_options: productData.extra_options || [],
    recipes: productData.recipes || [],
    updated_at: new Date().toISOString(),
  };

  // Only update slug if user provided an explicit non-empty slug
  if (productData.slug && productData.slug.trim().length > 0) {
    updatePayload.slug = productData.slug.trim();
  }

  // Update the product
  let { error: productError } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id);

  if (productError && (productError.code === "PGRST204" || productError.message.includes("schema cache") || productError.message.includes("column"))) {
    // If structured fields columns don't exist yet in Supabase, retry without them
    const { info_fields, prep_options, extra_options, recipes, ...basePayload } = updatePayload;
    const retry = await supabase
      .from("products")
      .update(basePayload)
      .eq("id", id);
    if (!retry.error) {
      productError = null;
    }
  }

  if (productError) {
    console.error("Error updating product in database:", productError);
    if (productError.message.includes("products_sku_key")) {
      return { success: false, error: "A product with this SKU already exists." };
    }
    if (productError.message.includes("products_barcode_key")) {
      return { success: false, error: "A product with this barcode already exists." };
    }
    if (productError.message.includes("products_slug_key")) {
      return { success: false, error: "A product with this URL slug already exists." };
    }
    return { success: false, error: productError.message };
  }

  // Handle images: delete old and insert new
  await supabase.from("product_images").delete().eq("product_id", id);
  
  if (images && images.length > 0) {
    const imageInserts = images.map((url: string, idx: number) => ({
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

  // Handle variants: delete old and insert new
  await supabase.from("product_variants").delete().eq("product_id", id);

  if (variants && variants.length > 0) {
    const variantInserts = variants.map((v: any) => ({
      product_id: id,
      name: `${v.weight ?? 0} ${v.unit ?? "gms"}`,
      weight: Number(v.weight) || 0,
      unit: v.unit || "gms",
      mrp: Number(v.mrp) || 0,
      selling_price: Number(v.selling_price) || 0,
      stock: Number(v.stock) || 0,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantInserts);

    if (variantError) {
      console.error("Error updating variants:", variantError);
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}
