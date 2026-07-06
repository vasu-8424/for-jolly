"use server";

import { createClient } from "@/lib/supabase/server";

export async function sweepOrphanImages(bucket: string = "products") {
  const supabase = await createClient();

  // 1. Fetch all product image URLs from database
  const { data: products, error: dbError } = await supabase
    .from("products")
    .select("images");

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  const activeImageUrls = new Set<string>();
  
  products.forEach((product) => {
    if (Array.isArray(product.images)) {
      product.images.forEach((url: string) => {
        // Extract just the filename/path from the public URL
        const parts = url.split(`/${bucket}/`);
        if (parts.length > 1) {
          activeImageUrls.add(parts[1]);
        }
      });
    }
  });

  // 2. Fetch all files from Supabase Storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(bucket)
    .list();

  if (storageError) {
    return { success: false, error: storageError.message };
  }

  const filesToDelete: string[] = [];

  storageFiles.forEach((file) => {
    // skip folders if any (represented by empty .emptyFolderPlaceholder)
    if (file.name === ".emptyFolderPlaceholder") return;

    if (!activeImageUrls.has(file.name)) {
      filesToDelete.push(file.name);
    }
  });

  // 3. Delete orphan files
  if (filesToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filesToDelete);
      
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
  }

  return { 
    success: true, 
    sweptCount: filesToDelete.length,
    activeCount: activeImageUrls.size,
    message: `Successfully deleted ${filesToDelete.length} orphan images.`
  };
}
