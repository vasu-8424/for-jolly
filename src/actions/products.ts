"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "@/lib/schemas";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request context
  }
}

export async function getProducts() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (id, name, is_visible),
      product_images (image_url, is_thumbnail, display_order)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Filter out any deleted/archived products so they are completely removed from the catalog view
  return (data || [])
    .filter((p: any) => !(Array.isArray(p.labels) && p.labels.includes("Archived")))
    .map((p: any) => {
      const hasOosLabel = Array.isArray(p.labels) && p.labels.some((l: string) => l.toLowerCase() === "outofstock" || l.toLowerCase() === "out of stock" || l.toLowerCase() === "out_of_stock");
      const isForceOos = p.force_out_of_stock === true || hasOosLabel;
      return {
        ...p,
        force_out_of_stock: isForceOos,
        is_out_of_stock: isForceOos || Number(p.stock ?? 0) <= 0,
      };
    });
}

export async function createProduct(values: ProductFormValues) {
  const supabase = await createAdminClient();
  const { images, is_unique, variants, ...productData } = values;

  // Strict Backend Validation: category_id
  const categoryId = productData.category_id?.trim();
  if (!categoryId || categoryId.length === 0) {
    return { success: false, error: "A valid category_id is required. Product cannot be created without a category." };
  }

  // Verify category existence
  const { data: categoryExists, error: catCheckError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .single();

  if (catCheckError || !categoryExists) {
    return { success: false, error: "The selected category does not exist in the database." };
  }

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

  const isOutOfStock = productData.force_out_of_stock === true;
  if (isOutOfStock) {
    if (!labels.some((l: string) => l.toLowerCase() === "outofstock")) {
      labels = [...labels, "outofstock"];
    }
  } else {
    labels = labels.filter((l: string) => 
      l.toLowerCase() !== "outofstock" && 
      l.toLowerCase() !== "out of stock" && 
      l.toLowerCase() !== "out_of_stock"
    );
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
    force_out_of_stock: productData.force_out_of_stock ?? false,
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

  safeRevalidatePath("/products");
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

      safeRevalidatePath("/products");
      return { success: true, message: "Product deleted successfully from catalog." };
    }

    console.error("Error deleting product:", error);
    return { success: false, error: `Could not delete product: ${error.message}` };
  }

  safeRevalidatePath("/products");
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
    const hasOosLabel = Array.isArray(data.labels) && data.labels.some((l: string) => l.toLowerCase() === "outofstock" || l.toLowerCase() === "out of stock" || l.toLowerCase() === "out_of_stock");
    data.force_out_of_stock = data.force_out_of_stock === true || hasOosLabel;
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
  data.force_out_of_stock = data.force_out_of_stock === true;

  return data;
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const supabase = await createAdminClient();
  const { images, is_unique, variants, ...productData } = values;

  // Strict Backend Validation: category_id
  const categoryId = productData.category_id?.trim();
  if (!categoryId || categoryId.length === 0) {
    return { success: false, error: "A valid category_id is required. Product cannot be updated without a category." };
  }

  // Verify category existence
  const { data: categoryExists, error: catCheckError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .single();

  if (catCheckError || !categoryExists) {
    return { success: false, error: "The selected category does not exist in the database." };
  }

  let labels = productData.labels || [];
  if (is_unique) {
    if (!labels.includes("Unique")) {
      labels = [...labels, "Unique"];
    }
  } else {
    labels = labels.filter((l: string) => l !== "Unique");
  }

  const isOutOfStock = productData.force_out_of_stock === true;
  if (isOutOfStock) {
    if (!labels.some((l: string) => l.toLowerCase() === "outofstock")) {
      labels = [...labels, "outofstock"];
    }
  } else {
    labels = labels.filter((l: string) => 
      l.toLowerCase() !== "outofstock" && 
      l.toLowerCase() !== "out of stock" && 
      l.toLowerCase() !== "out_of_stock"
    );
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
    force_out_of_stock: productData.force_out_of_stock ?? false,
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

  safeRevalidatePath("/products");
  safeRevalidatePath(`/products/${id}`);
  return { success: true };
}

export async function toggleProductOutOfStock(id: string, force_out_of_stock: boolean) {
  const supabase = await createAdminClient();

  // 1. Fetch current product data to get current labels
  const { data: currentProduct, error: fetchErr } = await supabase
    .from("products")
    .select("id, name, labels, stock")
    .eq("id", id)
    .single();

  if (fetchErr || !currentProduct) {
    console.error("Error fetching product for out-of-stock toggle:", fetchErr);
    return { success: false, error: fetchErr?.message || "Product not found" };
  }

  let labels: string[] = Array.isArray(currentProduct.labels) ? [...currentProduct.labels] : [];

  if (force_out_of_stock) {
    if (!labels.some((l: string) => l.toLowerCase() === "outofstock")) {
      labels.push("outofstock");
    }
  } else {
    labels = labels.filter(
      (l: string) =>
        l.toLowerCase() !== "outofstock" &&
        l.toLowerCase() !== "out of stock" &&
        l.toLowerCase() !== "out_of_stock"
    );
  }

  let { data, error } = await supabase
    .from("products")
    .update({ 
      force_out_of_stock,
      labels,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id, name, force_out_of_stock, stock, labels")
    .single();

  if (error && (error.code === "PGRST204" || error.message.includes("schema cache") || error.message.includes("column"))) {
    const retry = await supabase
      .from("products")
      .update({ labels })
      .eq("id", id);
    if (!retry.error) {
      error = null;
      data = { id, force_out_of_stock, name: currentProduct.name, stock: currentProduct.stock, labels } as any;
    }
  }

  if (error) {
    console.error("Error toggling product out-of-stock:", error);
    return { success: false, error: error.message };
  }

  safeRevalidatePath("/products");
  safeRevalidatePath("/inventory");
  safeRevalidatePath(`/products/${id}`);
  return {
    success: true,
    data,
    message: force_out_of_stock
      ? `Product marked as Out of Stock (labeled "outofstock" for mobile app).`
      : `Product marked as In Stock (purchasable by customers).`
  };
}
